import type { Metadata } from "next";
import { Patrick_Hand } from "next/font/google";
import { DebugModeBanner } from "@/components/DebugModeBanner";
import "./globals.css";

const patrickHand = Patrick_Hand({
  weight: "400",
  variable: "--font-hand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Snap and Seek",
  description: "Hide. Seek. Snap. Find them all.",
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
        <DebugModeBanner />
        {children}
      </body>
    </html>
  );
}
