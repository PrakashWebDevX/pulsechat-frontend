"use client";

import { useEffect, useState } from "react";
import {
  subscribeToPush,
  isPushSupported,
  getNotificationPermission,
} from "@/lib/pushNotifications";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface Props {
  userId?: string;
}

export default function PWAInstallPrompt({ userId }: Props) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    // Already installed as PWA?
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    // Android Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem("pwa-install-dismissed")) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show notification banner after 2s if not yet granted
    const perm = getNotificationPermission();
    if (perm === "default" && !localStorage.getItem("notif-asked")) {
      setTimeout(() => setShowNotifBanner(true), 2000);
    }

    // If already granted and userId available — subscribe silently
    if (userId && perm === "granted") {
      subscribeToPush(userId)
        .then((result) => {
          if (!result.success) console.warn("[PWA] Silent subscribe failed:", result.error);
        })
        .catch(() => {});
    }

    // Unlock Web Audio API on first user gesture (iOS requirement)
    const unlockAudio = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        ctx.resume().catch(() => {});
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

  // Handle PWA install
  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setShowInstallBanner(false);
    localStorage.setItem("pwa-install-dismissed", "true");
    if (outcome === "accepted") {
      showToast("✅ PulseChat installed!", "success");
    }
  };

  // Handle notification permission request
  const handleAllowNotifications = async () => {
    setShowNotifBanner(false);
    localStorage.setItem("notif-asked", "true");

    if (!isPushSupported()) {
      showToast("❌ Push not supported on this browser/device", "error");
      return;
    }

    if (!userId) {
      showToast("❌ Please log in first", "error");
      return;
    }

    const result = await subscribeToPush(userId);

    if (result.success) {
      showToast("🔔 Notifications enabled! You'll get alerts for new messages.", "success");
    } else {
      showToast(`❌ ${result.error || "Failed to enable notifications"}`, "error");
      // Show instructions for manually enabling
      if (result.error?.includes("blocked") || result.error?.includes("denied")) {
        setTimeout(() => {
          showToast("💡 Go to browser Settings → Site Settings → Notifications → Allow", "error");
        }, 4500);
      }
    }
  };

  return (
    <>
      {/* ── Install Banner ─────────────────────────────────────────────── */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-[200] animate-slide-up">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-sm mx-auto">
            <div className="w-11 h-11 rounded-xl bg-brand-500/15 flex items-center justify-center text-2xl flex-shrink-0">💬</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Install PulseChat</p>
              <p className="text-xs text-gray-500">Add to home screen for best experience</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => { setShowInstallBanner(false); localStorage.setItem("pwa-install-dismissed", "true"); }}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-surface-raised transition-colors">
                Later
              </button>
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 rounded-lg text-xs bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors">
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notification Banner ────────────────────────────────────────── */}
      {showNotifBanner && !showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-[200] animate-slide-up">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-4 shadow-2xl max-w-sm mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-yellow-500/15 flex items-center justify-center text-2xl flex-shrink-0">🔔</div>
              <div>
                <p className="text-sm font-semibold text-white">Enable Notifications</p>
                <p className="text-xs text-gray-500">Get notified when someone messages you — even when the app is closed</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowNotifBanner(false); localStorage.setItem("notif-asked", "true"); }}
                className="flex-1 py-2 rounded-xl text-xs text-gray-500 border border-surface-border hover:bg-surface-raised transition-colors">
                Not now
              </button>
              <button
                onClick={handleAllowNotifications}
                className="flex-1 py-2 rounded-xl text-xs bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition-colors">
                🔔 Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-[300] animate-fade-in`}>
          <div className={`rounded-2xl p-3 text-white text-sm text-center max-w-sm mx-auto shadow-xl
            ${toast.type === "success" ? "bg-brand-600" : "bg-red-600"}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </>
  );
}
