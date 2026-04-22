"use client";

import { SessionProvider, useSession } from "next-auth/react";
import dynamic from "next/dynamic";

const PWAInstallPrompt = dynamic(
  () => import("@/components/PWAInstallPrompt"),
  { ssr: false }
);

function InnerWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;

  return (
    <>
      {children}
      <PWAInstallPrompt userId={userId} />
    </>
  );
}

export function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <InnerWrapper>{children}</InnerWrapper>
    </SessionProvider>
  );
}
