"use client";

import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";

const PWAInstallPrompt = dynamic(
  () => import("@/components/PWAInstallPrompt"),
  { ssr: false }
);

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