import type { Metadata } from "next";
import AboutClient from "./AboutClient";
import { getClosedDaysText } from "@/lib/business-settings";
import { getCachedPaymentMethods } from "@/lib/payment-methods";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "店舗情報",
  description:
    "Men's hair MONEの店舗情報、アクセス、営業時間、定休日、支払方法、スタイリスト情報をご案内します。",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "店舗情報 | Men's hair MONE",
    description:
      "Men's hair MONEの店舗情報、アクセス、営業時間、定休日、支払方法、スタイリスト情報をご案内します。",
    url: "/about",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "店舗情報 | Men's hair MONE",
    description:
      "Men's hair MONEの店舗情報、アクセス、営業時間、定休日、支払方法、スタイリスト情報をご案内します。",
    images: ["/og-image.jpg"],
  },
};

export default async function AboutPage() {
  const [closedDaysText, paymentMethods] = await Promise.all([
    getClosedDaysText(),
    getCachedPaymentMethods(),
  ]);

  return (
    <AboutClient
      closedDaysText={closedDaysText}
      paymentMethods={paymentMethods}
    />
  );
}
