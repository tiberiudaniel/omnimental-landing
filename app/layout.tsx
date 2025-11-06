import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "OmniMental Coaching | Mental Coaching & Biofeedback";
const description =
  "OmniMental oferă programe de mental coaching, biofeedback și intervenții strategice pentru profesioniști care vor claritate sub presiune.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "https://omnimental.ro",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
