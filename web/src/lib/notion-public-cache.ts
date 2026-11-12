// src/lib/notion-public-cache.ts
// お知らせ・ギャラリー・商品の一覧（Notion）をタグ付きでキャッシュする。
//
// 画像は変わらない配信URL（/api/notion-image/...）になったので、署名付きURLの失効に合わせて
// ページを定期的に作り直す必要はない。内容が変わったかは cron（/api/cron/revalidate-notion）が
// Notion の最新とこのキャッシュを比べて判定し、変わったときだけタグを破棄する。

import { unstable_cache } from "next/cache";
import {
  getGalleryItems,
  getNews,
  getProducts,
  type BlogPost,
  type GalleryItem,
  type Product,
} from "@/lib/notion";

export const NOTION_CACHE_TAGS = {
  news: "notion-news",
  gallery: "notion-gallery",
  products: "notion-products",
} as const;

class EmptyNotionListError extends Error {}

// 空の結果はキャッシュしない。Notion の取得関数はエラー時も [] を返すため、
// 一時的な障害で「何もない」状態を固定しないようにする。
function cachedList<T>(fetcher: () => Promise<T[]>, key: string, tag: string) {
  const cached = unstable_cache(
    async () => {
      const items = await fetcher();
      if (items.length === 0) {
        throw new EmptyNotionListError(`${key} is empty`);
      }
      return items;
    },
    [key],
    // 時間では切らない。変更は cron / webhook のタグ破棄で反映する
    { tags: [tag], revalidate: false }
  );

  return {
    /** ページ表示用。取得できなければ [] */
    async get(): Promise<T[]> {
      try {
        return await cached();
      } catch (error) {
        if (!(error instanceof EmptyNotionListError)) {
          console.error(`[Notion Cache] Failed to load ${key}:`, error);
        }
        return [];
      }
    },
    /** cron の比較用。キャッシュが無い・取得できないときは null（＝変わった扱い） */
    async getOrNull(): Promise<T[] | null> {
      try {
        return await cached();
      } catch {
        return null;
      }
    },
  };
}

export const cachedNews = cachedList<BlogPost>(getNews, "notion-news-list-v1", NOTION_CACHE_TAGS.news);
export const cachedGallery = cachedList<GalleryItem>(
  getGalleryItems,
  "notion-gallery-list-v1",
  NOTION_CACHE_TAGS.gallery
);
export const cachedProducts = cachedList<Product>(
  getProducts,
  "notion-products-list-v1",
  NOTION_CACHE_TAGS.products
);

export const getCachedNews = () => cachedNews.get();
export const getCachedGalleryItems = () => cachedGallery.get();
export const getCachedProducts = () => cachedProducts.get();
