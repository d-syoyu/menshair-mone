// src/app/gallery/page.tsx
// Gallery page - Server Component with Notion integration

import { getGalleryItems } from "@/lib/notion";
import GalleryClient from "./GalleryClient";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function GalleryPage() {
  // Fetch items from Notion
  const items = await getGalleryItems();

  return <GalleryClient items={items} />;
}
