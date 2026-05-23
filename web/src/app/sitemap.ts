// src/app/sitemap.ts
// MONË - 動的サイトマップ生成

import { MetadataRoute } from "next";
import { getNews } from "@/lib/notion";
import { SITE_URL, toIsoDate } from "@/lib/seo";

const BASE_URL = SITE_URL;
export const revalidate = 3600;

function toSitemapDate(value: string | null | undefined): Date {
  const iso = toIsoDate(value);
  return iso ? new Date(iso) : new Date();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/menu`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/staff`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/news`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/gallery`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/booking`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // ニュース記事を動的に取得（Notion APIから）
  let newsPages: MetadataRoute.Sitemap = [];
  try {
    const news = await getNews();
    newsPages = news.map((post) => ({
      url: `${BASE_URL}/news/${post.slug}`,
      lastModified: toSitemapDate(post.updatedAt || post.createdAt || post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Failed to fetch news for sitemap:", error);
  }

  return [...staticPages, ...newsPages];
}
