import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ご予約",
  description:
    "Men's hair MONE（モネ）のオンライン予約。ヘッドスパ・シェービング・カットなど、お好みのメニューをお選びいただき、ご希望の日時でご予約いただけます。守口市のメンズ専用プライベートサロン。",
  openGraph: {
    title: "ご予約 | Men's hair MONE",
    description:
      "Men's hair MONEのオンライン予約。ヘッドスパ・シェービング・カットなど、お好みのメニューをお選びいただき、ご希望の日時でご予約いただけます。",
    url: "https://www.mone.hair/booking",
  },
  alternates: {
    canonical: "https://www.mone.hair/booking",
  },
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
