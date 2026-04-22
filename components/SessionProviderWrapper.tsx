"use client";

import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";

// Load PWA prompt client-side only (no SSR)
const PWAInstallPrompt = dynamic(() => import("./PWAInstallPrompt"), {
  ssr: false,
});

export function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
      <PWAInstallPrompt />
    </SessionProvider>
  );
}
