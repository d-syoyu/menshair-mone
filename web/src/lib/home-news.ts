// src/lib/home-news.ts
// トップページの「お知らせ」（最新3件）。
// Notion を毎回呼ばないよう unstable_cache に入れ、タグ HOME_NEWS_CACHE_TAG で破棄する。
// トップページは画像を出さない（タイトル・日付・slug のみ）ので、Notion の署名付き画像 URL の
// 期限切れを気にせず長くキャッシュできる。内容が変わったかは cron（/api/cron/revalidate-notion）が
// Notion の最新と比べて判定し、変わったときだけタグを破棄する。

import { unstable_cache } from "next/cache";
import { getNews, type BlogPost } from "@/lib/notion";

export const HOME_NEWS_CACHE_TAG = "notion-home-news";
const HOME_NEWS_LIMIT = 3;

export type HomeNewsItem = Pick<BlogPost, "id" | "slug" | "title" | "publishedAt">;

function getDateKey(item: BlogPost) {
  if (item.publishedAt) {
    return item.publishedAt.replace(/\./g, "");
  }

  return item.createdAt?.replace(/[-T:.Z]/g, "").slice(0, 8) || "0";
}

export function selectLatestHomeNews(news: BlogPost[]): HomeNewsItem[] {
  return [...news]
    .sort((a, b) => getDateKey(b).localeCompare(getDateKey(a)))
    .slice(0, HOME_NEWS_LIMIT)
    .map(({ id, slug, title, publishedAt }) => ({ id, slug, title, publishedAt }));
}

export function isSameHomeNews(a: HomeNewsItem[], b: HomeNewsItem[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

class EmptyHomeNewsError extends Error {}

// 空の結果はキャッシュしない（Notion の一時的な障害で「お知らせはありません」を固定しないため）。
// getNews() はエラー時も [] を返すので、空なら例外にして unstable_cache に保存させない。
const getCachedHomeNews = unstable_cache(
  async (): Promise<HomeNewsItem[]> => {
    const latest = selectLatestHomeNews(await getNews());
    if (latest.length === 0) {
      throw new EmptyHomeNewsError("No news fetched from Notion");
    }
    return latest;
  },
  ["home-news"],
  {
    tags: [HOME_NEWS_CACHE_TAG],
    // 時間では切らない。変更は cron / webhook のタグ破棄で反映する
    revalidate: false,
  }
);

export async function getHomeNews(): Promise<HomeNewsItem[]> {
  try {
    return await getCachedHomeNews();
  } catch (error) {
    if (!(error instanceof EmptyHomeNewsError)) {
      console.error("[Home News] Failed to load news:", error);
    }
    return [];
  }
}

/** キャッシュ済みの値を返す。取得できなければ null（＝比較不能なので更新扱いにする） */
export async function getCachedHomeNewsOrNull(): Promise<HomeNewsItem[] | null> {
  try {
    return await getCachedHomeNews();
  } catch {
    return null;
  }
}
