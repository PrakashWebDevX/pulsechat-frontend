"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Android/Desktop Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("pwa-dismissed");
      if (!dismissed) setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Notification permission banner
    if ("Notification" in window && Notification.permission === "default") {
      const notifDismissed = localStorage.getItem("notif-dismissed");
      if (!notifDismissed) {
        setTimeout(() => setShowNotifBanner(true), 4000);
      }
    }

    // Unlock audio on first user touch (required for iOS/Android)
    const unlockAudio = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
      } catch {}
      document.removeEventListener("touchstart", unlockAudio);
      document.removeEventListener("click", unlockAudio);
    };
    document.addEventListener("touchstart", unlockAudio, { passive: true });
    document.addEventListener("click", unlockAudio);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      document.removeEventListener("touchstart", unlockAudio);
      document.removeEventListener("click", unlockAudio);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setShowBanner(false);
    setInstallPrompt(null);
  };

  const handleRequestNotification = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("PulseChat 🎉", {
          body: "Notifications enabled! You'll get alerts for new messages.",
          icon: "/icon-192.png",
        });
      }
    } catch {}
    setShowNotifBanner(false);
    localStorage.setItem("notif-dismissed", "true");
  };

  if (installed) return null;

  return (
    <>
      {/* PWA Install Banner */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-2xl flex-shrink-0">
              💬
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Install PulseChat</p>
              <p className="text-xs text-gray-500">Add to home screen for best experience</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setShowBanner(false);
                  localStorage.setItem("pwa-dismissed", "true");
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-surface-raised transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 rounded-lg text-xs bg-brand-500 hover:bg-brand-600 text-white font-medium transition-colors"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Permission Banner */}
      {showNotifBanner && !showBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-2xl flex-shrink-0">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Enable Notifications</p>
              <p className="text-xs text-gray-500">Get alerts for new messages</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setShowNotifBanner(false);
                  localStorage.setItem("notif-dismissed", "true");
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-surface-raised transition-colors"
              >
                No
              </button>
              <button
                onClick={handleRequestNotification}
                className="px-3 py-1.5 rounded-lg text-xs bg-yellow-500 hover:bg-yellow-600 text-black font-medium transition-colors"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}