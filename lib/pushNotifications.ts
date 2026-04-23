const BASE = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

// Convert VAPID public key from base64url to Uint8Array
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function subscribeToPush(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!isPushSupported()) {
      return { success: false, error: "Push notifications not supported on this device" };
    }

    let permission = Notification.permission;
    if (permission === "denied") {
      return { success: false, error: "Notifications blocked. Enable in browser settings." };
    }
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") {
      return { success: false, error: "Notification permission denied" };
    }

    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.ready;
    } catch {
      return { success: false, error: "Service worker not ready" };
    }

    let publicKey: string;
    try {
      const res = await fetch(`${BASE}/api/push/vapid-public-key`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      publicKey = data.publicKey;
      if (!publicKey) throw new Error("No public key returned");
    } catch (err: any) {
      return { success: false, error: `Failed to get VAPID key: ${err.message}` };
    }

    let subscription: PushSubscription;
    try {
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        subscription = existing;
      } else {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
    } catch (err: any) {
      return { success: false, error: `Subscription failed: ${err.message}` };
    }

    try {
      const res = await fetch(`${BASE}/api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscription: subscription.toJSON() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      return { success: false, error: `Failed to save subscription: ${err.message}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function showLocalNotification(
  title: string,
  body: string,
  icon?: string,
  url = "/chat"
): void {
  try {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      document.hidden
    ) {
      const notif = new Notification(title, {
        body,
        icon: icon || "/icon-192.png",
        badge: "/icon-192.png",
        tag: "pulsechat-local",
        renotify: true,
      });
      notif.onclick = () => {
        window.focus();
        window.location.href = url;
        notif.close();
      };
    }
  } catch {}
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  try {
    if (!isPushSupported()) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await fetch(`${BASE}/api/push/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subscription: subscription.toJSON() }),
    });
    await subscription.unsubscribe();
  } catch {}
}