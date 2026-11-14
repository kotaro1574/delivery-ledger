import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "配達収支台帳",
    template: "%s | 配達収支台帳",
  },
  description: "Uber Eats 配達パートナー向けの収支管理アプリ",
  applicationName: "配達収支台帳",
  appleWebApp: {
    title: "収支台帳",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3efe6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
