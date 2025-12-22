import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ProfileProvider } from "@/components/ProfileProvider";
import { I18nProvider } from "@/components/I18nProvider";
import QueryLangSync from "@/components/QueryLangSync";
import { TelemetryScreenTracker } from "@/components/TelemetryScreenTracker";
import { Suspense } from "react";
import Script from "next/script";

// Site metadata
const title = "OmniMental Coaching | Mental Coaching & Biofeedback";
const description =
  "OmniMental oferă programe de mental coaching, biofeedback și intervenții strategice pentru profesioniști care vor claritate sub presiune.";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://omnimental.ro");

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(siteUrl),
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "OmniMental Coaching",
    images: [
      {
        url: "/assets/tech-mind-bg.jpg",
        width: 1200,
        height: 630,
        alt: "OmniMental Coaching",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/tech-mind-bg.jpg"],
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "var(--omni-ink)",
};

// Single RootLayout export
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" data-scroll-behavior="smooth">
      <body
        className="antialiased min-h-screen"
        style={{
          backgroundColor: "var(--omni-bg-main)",
          color: "var(--omni-ink)",
          fontFamily:
            'Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
        }}
      >
        <AuthProvider>
          <ProfileProvider>
            <I18nProvider>
              <Suspense fallback={null}>
                <QueryLangSync />
              </Suspense>
              <TelemetryScreenTracker />
              {children}
            </I18nProvider>
          </ProfileProvider>
        </AuthProvider>

        <Script id="e2e-flag" strategy="beforeInteractive">
          {`try{var params=new URLSearchParams(window.location.search);if((params.get('e2e')||'').toLowerCase()==='1'){window.__OMNI_E2E__=true;}}catch(e){}`}
        </Script>
        {/* GSAP loaded after page interactive for safety */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
