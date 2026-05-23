import type { Metadata } from "next";
import TermsClient from "./TermsClient";
import { getCachedPaymentMethods } from "@/lib/payment-methods";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "利用規約",
  description: "Men's hair MONEの利用規約です。予約、キャンセル、支払方法などをご確認ください。",
  alternates: {
    canonical: "/terms",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function TermsPage() {
  const paymentMethods = await getCachedPaymentMethods();

  return <TermsClient paymentMethods={paymentMethods} />;
}
