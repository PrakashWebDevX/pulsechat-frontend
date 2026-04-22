const BASE = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

/**
 * Subscribe user to push notifications.
 * Call this after user logs in.
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    // Check browser support
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push not supported");
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Push permission denied");
      return false;
    }

    // Get VAPID public key from server
    const keyRes = await fetch(`${BASE}/api/push/vapid-public-key`);
    const { publicKey } = await keyRes.json();
    if (!publicKey) return false;

    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    // Save subscription to server
    const res = await fetch(`${BASE}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subscription }),
    });

    if (res.ok) {
      console.log("✅ Push notifications enabled");
      return true;
    }
    return false;
  } catch (err) {
    console.error("Push subscription failed:", err);
    return false;
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribeFromPush(userId: string): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await fetch(`${BASE}/api/push/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscription }),
      });
      await subscription.unsubscribe();
    }
  } catch (err) {
    console.error("Unsubscribe failed:", err);
  }
}

/**
 * Show a local browser notification (when app is in background tab).
 */
export function showLocalNotification(title: string, body: string, icon?: string): void {
  try {
    if (Notification.permission === "granted" && document.hidden) {
      const notif = new Notification(title, {
        body,
        icon: icon || "/icon-192.png",
        badge: "/icon-192.png",
        tag: "pulsechat-msg",
        renotify: true,
        silent: false,
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    }
  } catch {}
}

// Helper: convert VAPID key from base64url to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
