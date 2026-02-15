import type { Metadata } from "next";
import { Patrick_Hand } from "next/font/google";
import "./globals.css";
import { SwRegistration } from "./SwRegistration";

const patrickHand = Patrick_Hand({
  weight: "400",
  variable: "--font-hand",
  subsets: ["latin"],
});

const baseUrl =
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL ?? "https://snapandseek.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Snap and Seek — Hide. Seek. Snap. Find them all.",
    template: "%s | Snap and Seek",
  },
  description:
    "Snap and Seek is a whimsical outdoor game with friends: a cross between hide and seek, scavenger hunt, and Jet Lag. Create a game, hide or seek, snap photos, and find everyone.",
  keywords: [
    "Snap and Seek",
    "outdoor game",
    "hide and seek",
    "scavenger hunt",
    "party game",
    "location-based game",
    "photo game",
    "Jet Lag game",
    "play with friends",
  ],
  authors: [{ name: "Snap and Seek" }],
  creator: "Snap and Seek",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Snap and Seek",
    title: "Snap and Seek — Hide. Seek. Snap. Find them all.",
    description:
      "A whimsical outdoor game with friends: hide and seek meets scavenger hunt. Create a game, snap photos, find everyone.",
    images: [
      {
        url: "/favicon/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Snap and Seek",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Snap and Seek — Hide. Seek. Snap. Find them all.",
    description: "Outdoor game with friends: hide and seek meets scavenger hunt. Create a game, snap photos, find everyone.",
    images: ["/favicon/android-chrome-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: "./" },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Snap and Seek",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Snap and Seek",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${patrickHand.variable} font-sans antialiased overflow-x-hidden`}
      >
        <SwRegistration />
        {children}
      </body>
    </html>
  );
}
