// src/app/gallery/page.tsx
// Gallery page - Server Component with Notion integration

import { getGalleryItems, type GalleryItem } from "@/lib/notion";
import GalleryClient from "./GalleryClient";

export const revalidate = 60; // Revalidate every 60 seconds

// Fallback data when Notion is not configured
const fallbackItems: GalleryItem[] = [
  {
    id: "1",
    title: "店内の様子",
    category: "店内",
    image: "/gallery-1.jpg",
    order: 1,
  },
  {
    id: "2",
    title: "シェービング施術",
    category: "施術",
    image: "/gallery-2.jpg",
    order: 2,
  },
  {
    id: "3",
    title: "ヘッドスパ",
    category: "施術",
    image: "/gallery-3.jpg",
    order: 3,
  },
  {
    id: "4",
    title: "リラックス空間",
    category: "店内",
    image: "/gallery-4.jpg",
    order: 4,
  },
  {
    id: "5",
    title: "カット施術",
    category: "施術",
    image: "/gallery-5.jpg",
    order: 5,
  },
  {
    id: "6",
    title: "待合スペース",
    category: "店内",
    image: "/gallery-6.jpg",
    order: 6,
  },
];

export default async function GalleryPage() {
  // Fetch items from Notion, fall back to static data if not configured
  let items = await getGalleryItems();

  if (items.length === 0) {
    items = fallbackItems;
  }

  return <GalleryClient items={items} />;
}
