import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";
import { ProfileProvider } from "../components/ProfileProvider";
import { I18nProvider } from "../components/I18nProvider";
import QueryLangSync from "../components/QueryLangSync";
import { Suspense } from "react";
import Script from "next/script";
import SiteFooter from "../components/SiteFooter";

// Font setup
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: "300",
});

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
};

// Single RootLayout export
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="antialiased">
        <AuthProvider>
          <ProfileProvider>
            <I18nProvider>
              <Suspense fallback={null}>
                <QueryLangSync />
              </Suspense>
              {children}
            </I18nProvider>
          </ProfileProvider>
        </AuthProvider>

        {/* GSAP loaded after page interactive for safety */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
          strategy="afterInteractive"
        />
        <SiteFooter />
      </body>
    </html>
  );
}
