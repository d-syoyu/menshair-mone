// src/app/gallery/page.tsx
// Gallery page - Server Component with Notion integration

import { getGalleryItems } from "@/lib/notion";
import GalleryClient from "./GalleryClient";
import type { Metadata } from "next";
import { buildGalleryJsonLd, renderJsonLd } from "@/lib/seo";

export const revalidate = 3600;

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
  const items = await getGalleryItems();

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
