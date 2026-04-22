"use client";

import { useEffect, useState } from "react";
import { unlockAudio } from "@/lib/sounds";

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
    // Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Listen for install prompt (Android/Desktop Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("pwa-dismissed");
      if (!dismissed) setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check notification permission
    if ("Notification" in window && Notification.permission === "default") {
      const notifDismissed = localStorage.getItem("notif-dismissed");
      if (!notifDismissed) {
        setTimeout(() => setShowNotifBanner(true), 3000);
      }
    }

    // Unlock audio on first interaction
    const unlockHandler = () => {
      unlockAudio();
      document.removeEventListener("touchstart", unlockHandler);
      document.removeEventListener("click", unlockHandler);
    };
    document.addEventListener("touchstart", unlockHandler, { passive: true });
    document.addEventListener("click", unlockHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      document.removeEventListener("touchstart", unlockHandler);
      document.removeEventListener("click", unlockHandler);
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
        // Show test notification
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
      {/* Install Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-2xl flex-shrink-0">
              💬
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Install PulseChat</p>
              <p className="text-xs text-gray-500">Add to home screen for the best experience</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => { setShowBanner(false); localStorage.setItem("pwa-dismissed", "true"); }}
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
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-2xl flex-shrink-0">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Enable Notifications</p>
              <p className="text-xs text-gray-500">Get alerts when you receive messages</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => { setShowNotifBanner(false); localStorage.setItem("notif-dismissed", "true"); }}
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
