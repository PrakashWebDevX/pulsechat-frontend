"use client";

import { useEffect, useState } from "react";
import { subscribeToPush } from "@/lib/pushNotifications";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface Props {
  userId?: string; // Pass userId to auto-subscribe to push
}

export default function PWAInstallPrompt({ userId }: Props) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [notifStatus, setNotifStatus] = useState<"idle" | "success" | "denied">("idle");

  useEffect(() => {
    // Already installed as PWA?
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) setInstalled(true);

    // Android/Desktop install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem("pwa-dismissed")) setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show notification banner after 3 seconds if not granted
    if ("Notification" in window && Notification.permission === "default") {
      if (!localStorage.getItem("notif-dismissed")) {
        setTimeout(() => setShowNotifBanner(true), 3000);
      }
    }

    // If already granted and we have userId, subscribe silently
    if (userId && "Notification" in window && Notification.permission === "granted") {
      subscribeToPush(userId).catch(() => {});
    }

    // Unlock audio on first touch (iOS requirement)
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
  }, [userId]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setShowBanner(false);
    localStorage.setItem("pwa-dismissed", "true");
  };

  const handleAllowNotifications = async () => {
    setShowNotifBanner(false);
    localStorage.setItem("notif-dismissed", "true");

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotifStatus("success");
        // Subscribe to push if we have userId
        if (userId) {
          await subscribeToPush(userId);
        }
        // Show confirmation
        new Notification("PulseChat 🎉", {
          body: "You'll now receive message notifications!",
          icon: "/icon-192.png",
        });
        setTimeout(() => setNotifStatus("idle"), 3000);
      } else {
        setNotifStatus("denied");
        setTimeout(() => setNotifStatus("idle"), 3000);
      }
    } catch {}
  };

  return (
    <>
      {/* PWA Install Banner */}
      {showBanner && !installed && (
        <div className="fixed bottom-4 left-4 right-4 z-[100] animate-slide-up">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-2xl flex-shrink-0">💬</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Install PulseChat</p>
              <p className="text-xs text-gray-500">Add to home screen for the best experience</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { setShowBanner(false); localStorage.setItem("pwa-dismissed", "true"); }}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-surface-raised transition-colors">
                Later
              </button>
              <button onClick={handleInstall}
                className="px-3 py-1.5 rounded-lg text-xs bg-brand-500 hover:bg-brand-600 text-white font-medium transition-colors">
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Permission Banner */}
      {showNotifBanner && !showBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-[100] animate-slide-up">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-2xl flex-shrink-0">🔔</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Enable Notifications</p>
              <p className="text-xs text-gray-500">Get notified when someone messages you</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { setShowNotifBanner(false); localStorage.setItem("notif-dismissed", "true"); }}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-surface-raised transition-colors">
                No
              </button>
              <button onClick={handleAllowNotifications}
                className="px-3 py-1.5 rounded-lg text-xs bg-yellow-500 hover:bg-yellow-600 text-black font-medium transition-colors">
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {notifStatus === "success" && (
        <div className="fixed top-4 left-4 right-4 z-[100] animate-fade-in">
          <div className="bg-brand-500/90 rounded-2xl p-3 text-white text-sm text-center max-w-sm mx-auto shadow-xl">
            ✅ Notifications enabled! You'll be notified of new messages.
          </div>
        </div>
      )}

      {notifStatus === "denied" && (
        <div className="fixed top-4 left-4 right-4 z-[100] animate-fade-in">
          <div className="bg-red-500/90 rounded-2xl p-3 text-white text-sm text-center max-w-sm mx-auto shadow-xl">
            ❌ Notifications blocked. Enable them in browser settings.
          </div>
        </div>
      )}
    </>
  );
}
