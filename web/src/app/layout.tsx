import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1a1a1a",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mone0601.com"),
  title: {
    default: "Men's hair MONE | 守口市メンズ専用サロン",
    template: "%s | Men's hair MONE",
  },
  description:
    "守口市のメンズ専用プライベートサロン Men's hair MONE（モネ）。ヘッドスパ・シェービング・カットなど、大人の男性に寄り添った上質な施術をご提供します。谷町線守口駅から徒歩8分。",
  keywords: [
    "メンズサロン",
    "守口市",
    "ヘッドスパ",
    "シェービング",
    "理容室",
    "床屋",
    "男性専用",
    "プライベートサロン",
  ],
  authors: [{ name: "Men's hair MONE" }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://www.mone0601.com",
    siteName: "Men's hair MONE",
    title: "Men's hair MONE | 守口市メンズ専用サロン",
    description:
      "守口市のメンズ専用プライベートサロン。ヘッドスパ・シェービング・カットなど、大人の男性に寄り添った上質な施術をご提供。",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Men's hair MONE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Men's hair MONE | 守口市メンズ専用サロン",
    description:
      "守口市のメンズ専用プライベートサロン。ヘッドスパ・シェービング・カットなど、大人の男性に寄り添った上質な施術をご提供。",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Google Search Console verification (add when available)
    // google: "verification-code",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
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
