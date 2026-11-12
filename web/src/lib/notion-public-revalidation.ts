import { revalidatePath, revalidateTag } from "next/cache";
import { getNews, type BlogPost } from "@/lib/notion";
import {
  HOME_NEWS_CACHE_TAG,
  getCachedHomeNewsOrNull,
  isSameHomeNews,
  selectLatestHomeNews,
} from "@/lib/home-news";

// トップページ（/）はここに入れない。お知らせが変わったときだけ HOME_NEWS_CACHE_TAG で更新する。
// 以下のページは Notion の署名付き画像 URL（約1時間で失効）を含むため、定期的に作り直す。
const NOTION_PUBLIC_PAGE_PATHS = [
  "/news",
  "/gallery",
  "/products",
  "/sitemap.xml",
];

const NOTION_PUBLIC_API_PATHS = [
  "/api/news",
  "/api/gallery",
  "/api/products",
];

type WarmupResult = {
  warmedPaths: string[];
  failedWarmups: { path: string; status?: number; error?: string }[];
};

async function warmRevalidatedPaths(origin: string | undefined, paths: string[]): Promise<WarmupResult> {
  if (!origin) {
    return { warmedPaths: [], failedWarmups: [] };
  }

  const baseUrl = origin.replace(/\/$/, "");
  const results = await Promise.allSettled(
    paths.map(async (path) => {
      const response = await fetch(`${baseUrl}${path}`, {
        cache: "no-store",
        headers: {
          "user-agent": "mone-notion-revalidate-cron",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return path;
    })
  );

  const warmedPaths: string[] = [];
  const failedWarmups: WarmupResult["failedWarmups"] = [];

  results.forEach((result, index) => {
    const path = paths[index];

    if (result.status === "fulfilled") {
      warmedPaths.push(result.value);
      return;
    }

    failedWarmups.push({
      path,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });
  });

  return { warmedPaths, failedWarmups };
}

export async function revalidateNotionPublicContent(options?: { origin?: string; warm?: boolean }) {
  const revalidatedPaths = new Set<string>();
  const warmupPaths = new Set<string>(NOTION_PUBLIC_PAGE_PATHS);

  for (const path of [...NOTION_PUBLIC_PAGE_PATHS, ...NOTION_PUBLIC_API_PATHS]) {
    revalidatePath(path);
    revalidatedPaths.add(path);
  }

  let news: BlogPost[] | null = null;
  try {
    news = await getNews();
  } catch (error) {
    console.error("[Notion Public Revalidation] Failed to fetch news:", error);
  }

  const homeNewsChanged = await revalidateHomeNewsIfChanged(news);
  if (homeNewsChanged) {
    revalidatedPaths.add("/");
    warmupPaths.add("/");
  }

  try {
    if (!news) throw new Error("news unavailable");
    const warmNewsLimit = Number(process.env.NOTION_REVALIDATE_WARM_NEWS_LIMIT ?? 20);

    for (const post of news) {
      const path = `/news/${post.slug}`;
      revalidatePath(path);
      revalidatePath(`/api/news/${post.slug}`);
      revalidatedPaths.add(path);
      revalidatedPaths.add(`/api/news/${post.slug}`);

      if (warmupPaths.size < NOTION_PUBLIC_PAGE_PATHS.length + warmNewsLimit) {
        warmupPaths.add(path);
      }
    }
  } catch (error) {
    console.error("[Notion Public Revalidation] Failed to fetch news slugs:", error);
  }

  const warmup = options?.warm
    ? await warmRevalidatedPaths(options.origin, Array.from(warmupPaths))
    : { warmedPaths: [], failedWarmups: [] };

  return {
    revalidatedPaths: Array.from(revalidatedPaths),
    homeNewsChanged,
    ...warmup,
  };
}

/**
 * トップページのお知らせ（最新3件）が Notion の最新と違うときだけタグを破棄する。
 * 取得に失敗した（空の）ときは、表示中の内容を消さないよう何もしない。
 */
async function revalidateHomeNewsIfChanged(news: BlogPost[] | null): Promise<boolean> {
  if (!news || news.length === 0) {
    return false;
  }

  const latest = selectLatestHomeNews(news);
  const cached = await getCachedHomeNewsOrNull();

  if (cached && isSameHomeNews(cached, latest)) {
    return false;
  }

  // データキャッシュを即時に破棄（'max' だと再生成時に古いお知らせを再利用してしまう）。
  // その直後に warm でトップを再生成するので、訪問者が待たされることはない。
  revalidateHomeNews();
  return true;
}

/** Notion のボタン（webhook）など、確実に変わったと分かっているとき用 */
export function revalidateHomeNews() {
  revalidateTag(HOME_NEWS_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
}
