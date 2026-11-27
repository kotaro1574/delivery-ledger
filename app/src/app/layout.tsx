import type { Metadata, Viewport } from "next";
import { DotGothic16, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const dotGothic = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dotgothic",
});

const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-spline-mono",
});

export const metadata: Metadata = {
  title: {
    default: "配達収支台帳",
    template: "%s | 配達収支台帳",
  },
  description: "Uber Eats 配達パートナー向けの収支管理アプリ",
  applicationName: "配達収支台帳",
  appleWebApp: {
    title: "収支台帳",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f2a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${dotGothic.variable} ${splineMono.variable}`}
      lang="ja"
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
