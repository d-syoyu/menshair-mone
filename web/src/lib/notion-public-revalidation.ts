import { revalidatePath, revalidateTag } from "next/cache";
import {
  getGalleryItems,
  getNews,
  getProducts,
  type BlogPost,
} from "@/lib/notion";
import {
  HOME_NEWS_CACHE_TAG,
  getCachedHomeNewsOrNull,
  isSameHomeNews,
  selectLatestHomeNews,
} from "@/lib/home-news";
import { NOTION_CACHE_TAGS, cachedGallery, cachedNews, cachedProducts } from "@/lib/notion-public-cache";

// Notion の内容をページに反映する（15分ごとの cron から呼ばれる）。
// 画像は変わらない配信URLなので、以前のように毎回すべてのページを作り直す必要はない。
// Notion の最新とキャッシュを比べ、変わったものだけタグとパスを破棄して作り直す。
// Notion しか読まないので DB は起こさない。

function isSameList(a: unknown[], b: unknown[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

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
  const warmupPaths = new Set<string>();
  const changed: string[] = [];

  const revalidate = (path: string, warm = true) => {
    revalidatePath(path);
    revalidatedPaths.add(path);
    if (warm && !path.startsWith("/api/")) warmupPaths.add(path);
  };

  const [freshNews, freshGallery, freshProducts] = await Promise.all([
    getNews().catch(() => [] as BlogPost[]),
    getGalleryItems().catch(() => []),
    getProducts().catch(() => []),
  ]);

  // お知らせ：一覧・サイトマップと、変わった記事の詳細ページ
  // 取得に失敗した（空の）ときは、表示中の内容を消さないよう何もしない
  if (freshNews.length > 0) {
    const cached = await cachedNews.getOrNull();
    if (!cached || !isSameList(cached, freshNews)) {
      revalidateTag(NOTION_CACHE_TAGS.news, { expire: 0 });
      changed.push("news");
      revalidate("/news");
      revalidate("/sitemap.xml");
      revalidate("/api/news");

      const before = new Map((cached ?? []).map((post) => [post.slug, JSON.stringify(post)]));
      const after = new Map(freshNews.map((post) => [post.slug, JSON.stringify(post)]));
      const warmNewsLimit = Number(process.env.NOTION_REVALIDATE_WARM_NEWS_LIMIT ?? 20);
      let warmed = 0;
      for (const slug of new Set([...before.keys(), ...after.keys()])) {
        if (before.get(slug) === after.get(slug)) continue;
        const stillPublished = after.has(slug);
        revalidate(`/news/${slug}`, stillPublished && warmed++ < warmNewsLimit);
        revalidate(`/api/news/${slug}`, false);
      }
    }
  }

  if (freshGallery.length > 0) {
    const cached = await cachedGallery.getOrNull();
    if (!cached || !isSameList(cached, freshGallery)) {
      revalidateTag(NOTION_CACHE_TAGS.gallery, { expire: 0 });
      changed.push("gallery");
      revalidate("/gallery");
      revalidate("/api/gallery");
    }
  }

  if (freshProducts.length > 0) {
    const cached = await cachedProducts.getOrNull();
    if (!cached || !isSameList(cached, freshProducts)) {
      revalidateTag(NOTION_CACHE_TAGS.products, { expire: 0 });
      changed.push("products");
      revalidate("/products");
      revalidate("/api/products");
    }
  }

  const homeNewsChanged = await revalidateHomeNewsIfChanged(freshNews);
  if (homeNewsChanged) {
    changed.push("home");
    revalidatedPaths.add("/");
    warmupPaths.add("/");
  }

  const warmup = options?.warm
    ? await warmRevalidatedPaths(options.origin, Array.from(warmupPaths))
    : { warmedPaths: [], failedWarmups: [] };

  return {
    changed,
    revalidatedPaths: Array.from(revalidatedPaths),
    homeNewsChanged,
    ...warmup,
  };
}

/**
 * トップページのお知らせ（最新3件）が Notion の最新と違うときだけタグを破棄する。
 * 取得に失敗した（空の）ときは、表示中の内容を消さないよう何もしない。
 */
async function revalidateHomeNewsIfChanged(news: BlogPost[]): Promise<boolean> {
  if (news.length === 0) {
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

/** トップのお知らせを作り直す */
export function revalidateHomeNews() {
  revalidateTag(HOME_NEWS_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
}

/** Notion のボタン（webhook）など、お知らせが確実に変わったと分かっているとき用 */
export function revalidatePublicNews(slug?: string) {
  revalidateHomeNews();
  revalidateTag(NOTION_CACHE_TAGS.news, { expire: 0 });
  revalidatePath("/news");
  revalidatePath("/sitemap.xml");
  revalidatePath("/api/news");
  if (slug) {
    revalidatePath(`/news/${slug}`);
    revalidatePath(`/api/news/${slug}`);
  }
}
