// src/app/gallery/page.tsx
// Gallery page - Server Component with Notion integration

import { getGalleryItems } from "@/lib/notion";
import GalleryClient from "./GalleryClient";

// 動的レンダリングに変更（キャッシュなし）
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  return <GalleryClient items={sortedItems} />;
}
