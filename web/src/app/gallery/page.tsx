// src/app/gallery/page.tsx
// Gallery page - Server Component with Notion integration

import { getCachedGalleryItems } from "@/lib/notion-public-cache";
import GalleryClient from "./GalleryClient";
import type { Metadata } from "next";
import { buildGalleryJsonLd, renderJsonLd } from "@/lib/seo";

export const revalidate = 86400; // 内容の変更は cron / webhook のタグ破棄で即時に反映。これは1日ごとの予備

export const metadata: Metadata = {
  title: "ギャラリー",
  description: "Men's hair MONEの店内、施術、スタイル写真をご紹介します。",
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: "ギャラリー | Men's hair MONE",
    description: "Men's hair MONEの店内、施術、スタイル写真をご紹介します。",
    url: "/gallery",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ギャラリー | Men's hair MONE",
    description: "Men's hair MONEの店内、施術、スタイル写真をご紹介します。",
    images: ["/og-image.jpg"],
  },
};

export default async function GalleryPage() {
  // Fetch items from Notion
  const items = await getCachedGalleryItems();

  // 作成日の降順（新しい順）にソート（左から新しい順）
  const sortedItems = [...items].sort((a, b) => {
    // createdAt は ISO 8601 形式
    const dateA = a.createdAt || '';
    const dateB = b.createdAt || '';
    return dateB.localeCompare(dateA);
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: renderJsonLd(buildGalleryJsonLd(sortedItems)),
        }}
      />
      <GalleryClient items={sortedItems} />
    </>
  );
}
