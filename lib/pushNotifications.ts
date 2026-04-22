const BASE = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

// Convert VAPID public key from base64url to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push is supported on this device/browser
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Get current notification permission
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

// Main function: subscribe user to push notifications
export async function subscribeToPush(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Step 1: Check support
    if (!isPushSupported()) {
      return { success: false, error: "Push notifications not supported on this device" };
    }

    // Step 2: Check permission
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

    // Step 3: Wait for service worker
    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.ready;
      console.log("[Push] SW ready:", registration.scope);
    } catch (err) {
      return { success: false, error: "Service worker not ready" };
    }

    // Step 4: Get VAPID public key
    let publicKey: string;
    try {
      const res = await fetch(`${BASE}/api/push/vapid-public-key`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      publicKey = data.publicKey;
      if (!publicKey) throw new Error("No public key returned");
      console.log("[Push] Got VAPID key");
    } catch (err: any) {
      return { success: false, error: `Failed to get VAPID key: ${err.message}` };
    }

    // Step 5: Get or create push subscription
    let subscription: PushSubscription;
    try {
      // Check for existing subscription first
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        console.log("[Push] Using existing subscription");
        subscription = existing;
      } else {
        console.log("[Push] Creating new subscription...");
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        console.log("[Push] New subscription created");
      }
    } catch (err: any) {
      return { success: false, error: `Subscription failed: ${err.message}` };
    }

    // Step 6: Save subscription to server
    try {
      const res = await fetch(`${BASE}/api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscription: subscription.toJSON() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      console.log("[Push] Subscription saved to server ✅");
    } catch (err: any) {
      return { success: false, error: `Failed to save subscription: ${err.message}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Push] Unexpected error:", err);
    return { success: false, error: err.message };
  }
}

// Show a local notification (when app is in background tab on desktop)
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
  } catch (err) {
    console.warn("[Push] Local notification failed:", err);
  }
}

// Unsubscribe from push
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
    console.log("[Push] Unsubscribed");
  } catch (err) {
    console.error("[Push] Unsubscribe error:", err);
  }
}
