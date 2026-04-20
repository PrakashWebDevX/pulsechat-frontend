import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";
import { ThemeProvider } from "@/lib/ThemeContext";

export const metadata: Metadata = {
  title: "PulseChat",
  description: "Real-time private messaging",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "PulseChat" },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 1,
  userScalable: false, viewportFit: "cover", themeColor: "#0f1117",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased overflow-hidden">
        <ThemeProvider>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
