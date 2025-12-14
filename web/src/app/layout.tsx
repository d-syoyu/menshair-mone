import type { Metadata } from "next";
import { Cormorant_Garamond, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingPhoneButton";
import { SessionProvider } from "../components/providers/session-provider";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Men's hair MONE: 守口市 メンズヘアー＆脱毛サロン",
  description: "守口市のメンズ専用サロン Men's hair MONE。ヘッドスパ・シェービング・脱毛など、大人の男性に寄り添った施術をご提供します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`scroll-smooth ${cormorant.variable} ${zenKaku.variable}`} data-scroll-behavior="smooth">
      <body className="flex flex-col min-h-screen">
        <SessionProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <FloatingButtons />
        </SessionProvider>
      </body>
    </html>
  );
}
