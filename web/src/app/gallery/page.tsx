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

  return <GalleryClient items={items} />;
}
