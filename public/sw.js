/* ============================================================
   PulseChat Service Worker v3
   Handles: PWA install, offline cache, push notifications
   ============================================================ */

const CACHE_VERSION = "pulsechat-v3";
const OFFLINE_PAGE  = "/offline.html";

const PRECACHE_URLS = ["/", "/chat", "/login", OFFLINE_PAGE];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_URLS.map((url) => cache.add(url).catch(() => {}))
        );
      })
      .then(() => {
        console.log("[SW] Installed");
        return self.skipWaiting();
      })
  );
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => {
              console.log("[SW] Deleting old cache:", k);
              return caches.delete(k);
            })
        )
      )
      .then(() => {
        console.log("[SW] Activated");
        return self.clients.claim();
      })
  );
});

// ── Fetch (offline support) ────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  // Skip: API calls, socket.io, external services
  const url = event.request.url;
  if (
    url.includes("/api/") ||
    url.includes("socket.io") ||
    url.includes("onrender.com") ||
    url.includes("googleapis.com") ||
    url.includes("googleusercontent.com")
  ) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_VERSION)
            .then((cache) => cache.put(event.request, clone))
            .catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request)
          .then((cached) => cached || caches.match(OFFLINE_PAGE))
      )
  );
});

// ── Push Notification ──────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  console.log("[SW] Push received");

  let data = {
    title: "PulseChat",
    body: "You have a new message",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    url: "/chat",
    tag: "pulsechat",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag || "pulsechat-msg",
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    silent: false,
    data: {
      url: data.url || "/chat",
      senderId: data.senderId,
      timestamp: Date.now(),
    },
    // Android action buttons
    actions: [
      { action: "open",    title: "Open"    },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log("[SW] Notification shown:", data.title))
      .catch((err) => console.error("[SW] Notification error:", err))
  );
});

// ── Notification Click ─────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action);
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/chat";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      // Find existing open window
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window if none found
      return clients.openWindow(targetUrl);
    })
  );
});

// ── Notification Close ─────────────────────────────────────────────────────
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed");
});

// ── Message from page ──────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
  // Ping to check SW is alive
  if (event.data === "PING") {
    event.ports[0]?.postMessage("PONG");
  }
});
