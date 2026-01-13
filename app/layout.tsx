import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Antigravity | 不動産分析ダッシュボード",
  description: "企業の賃貸等不動産データを分析し、未来的なインターフェースで可視化するダッシュボード",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        {/* Space background effects */}
        <div className="space-bg" />
        <div className="stars" />
        <div className="energy-lines" />
        
        {children}
      </body>
    </html>
  );
}
