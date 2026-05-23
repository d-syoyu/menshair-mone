import { revalidatePath } from "next/cache";
import { getNews } from "@/lib/notion";

const NOTION_PUBLIC_PAGE_PATHS = [
  "/",
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

  try {
    const news = await getNews();
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
    ...warmup,
  };
}
