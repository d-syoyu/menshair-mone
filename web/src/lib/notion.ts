// src/lib/notion.ts
// Notion API Client and Helper Functions (2025-09-03 API)

import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
  DatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { unstable_cache } from "next/cache";
import { getProxiedImageUrl } from "./image-proxy";

// Notion Client - only create if API key is set
// SDK v5 uses 2025-09-03 API by default
// タイムアウトを10秒に設定（Vercelのデフォルト関数タイムアウトに合わせる）
const notion = process.env.NOTION_API_KEY
  ? new Client({
      auth: process.env.NOTION_API_KEY,
      timeoutMs: 10000, // 10秒タイムアウト
    })
  : null;

// SDK v5では databases.query が型定義から除外されているが、実際には動作する
// フォールバック用の型定義
interface DatabaseQueryResponse {
  results: Array<PageObjectResponse | { id: string; object: "page" }>;
  next_cursor: string | null;
  has_more: boolean;
}
type DatabasesQueryFn = (args: { database_id: string }) => Promise<DatabaseQueryResponse>;

// queryDatabaseを遅延初期化するためのヘルパー関数
function getQueryDatabase(): DatabasesQueryFn | null {
  if (!notion) return null;
  const notionWithQuery = notion as unknown as { databases: { query: DatabasesQueryFn } };
  return notionWithQuery.databases.query.bind(notionWithQuery.databases);
}

// リトライ設定
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1秒

// リトライ付きAPI呼び出しヘルパー
async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const isRetryable =
        error instanceof Error &&
        (error.message.includes("timeout") ||
         error.message.includes("ETIMEDOUT") ||
         error.message.includes("ECONNRESET") ||
         error.message.includes("rate_limited") ||
         error.message.includes("502") ||
         error.message.includes("503") ||
         error.message.includes("504"));

      if (!isRetryable || attempt === retries) {
        console.error(`[Notion ${context}] Failed after ${attempt} attempt(s):`, error);
        throw error;
      }

      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
      console.warn(`[Notion ${context}] Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

const newsDatabaseId = process.env.NOTION_DATABASE_ID_NEWS;
const galleryDatabaseId = process.env.NOTION_DATABASE_ID_GALLERY;
const productsDatabaseId = process.env.NOTION_DATABASE_ID_PRODUCTS;

// Cache for data_source_id (avoids repeated API calls)
let cachedNewsDataSourceId: string | null = null;
let cachedGalleryDataSourceId: string | null = null;
let cachedProductsDataSourceId: string | null = null;

// Get data_source_id for News database (required for 2025-09-03 API)
async function getNewsDataSourceId(): Promise<string | null> {
  if (cachedNewsDataSourceId) return cachedNewsDataSourceId;
  if (!notion || !newsDatabaseId) return null;

  try {
    const database = await withRetry(
      () => notion.databases.retrieve({ database_id: newsDatabaseId }) as Promise<DatabaseObjectResponse>,
      "getNewsDataSourceId"
    );

    if (database.data_sources && database.data_sources.length > 0) {
      cachedNewsDataSourceId = database.data_sources[0].id;
      return cachedNewsDataSourceId;
    }
    return null;
  } catch (error) {
    console.error("Error fetching news data source id:", error);
    return null;
  }
}

// Get data_source_id for Gallery database
async function getGalleryDataSourceId(): Promise<string | null> {
  if (cachedGalleryDataSourceId) return cachedGalleryDataSourceId;
  if (!notion || !galleryDatabaseId) return null;

  try {
    const database = await withRetry(
      () => notion.databases.retrieve({ database_id: galleryDatabaseId }) as Promise<DatabaseObjectResponse>,
      "getGalleryDataSourceId"
    );

    if (database.data_sources && database.data_sources.length > 0) {
      cachedGalleryDataSourceId = database.data_sources[0].id;
      return cachedGalleryDataSourceId;
    }
    return null;
  } catch (error) {
    console.error("Error fetching gallery data source id:", error);
    return null;
  }
}

// Types
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  coverImage: string | null;
  publishedAt: string;
  category: string;
}

export interface BlogPostDetail extends BlogPost {
  blocks: BlockObjectResponse[];
  fallbackContent?: string;
}

// Helper: Extract rich text content
function extractRichText(richText: RichTextItemResponse[]): string {
  return richText.map((text) => text.plain_text).join("");
}

// Helper: Format date
function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

// Helper: Extract page properties (日本語プロパティ名対応)
function extractPageProperties(page: PageObjectResponse): BlogPost | null {
  const properties = page.properties;

  // タイトル (Title)
  const titleProp = properties["タイトル"] || properties["Title"];
  if (titleProp?.type !== "title") return null;
  const title = extractRichText(titleProp.title);

  // ページURL (Slug) - なければpage.idを使用
  const slugProp = properties["ページURL"] || properties["Slug"];
  let slug = "";
  if (slugProp?.type === "rich_text") {
    slug = extractRichText(slugProp.rich_text);
  }
  if (!slug) {
    slug = page.id.replace(/-/g, "");
  }

  // 公開 (Published) - checkbox型
  // ニュースは「web公開」、ギャラリー・商品は「公開」を使用
  const publishedProp = properties["web公開"] || properties["公開"] || properties["Published"];
  if (publishedProp?.type === "checkbox") {
    if (!publishedProp.checkbox) return null;
  }

  // 公開日 (PublishedAt)
  const publishedAtProp = properties["公開日"] || properties["PublishedAt"];
  const publishedAt =
    publishedAtProp?.type === "date" && publishedAtProp.date
      ? formatDate(publishedAtProp.date.start)
      : "";

  // 本文 (Excerpt)
  const excerptProp = properties["本文"] || properties["Excerpt"];
  const excerpt =
    excerptProp?.type === "rich_text"
      ? extractRichText(excerptProp.rich_text)
      : "";

  // カテゴリ (Category)
  const categoryProp = properties["カテゴリ"] || properties["Category"];
  const category =
    categoryProp?.type === "select" && categoryProp.select
      ? categoryProp.select.name
      : "";

  // サブタイトル (Subtitle)
  const subtitleProp = properties["サブタイトル"] || properties["Subtitle"];
  const subtitle =
    subtitleProp?.type === "rich_text"
      ? extractRichText(subtitleProp.rich_text)
      : "";

  // サムネイル (Cover Image) - filesプロパティまたはページカバーから取得
  let coverImage: string | null = null;
  const thumbnailProp = properties["サムネイル"];
  if (thumbnailProp?.type === "files" && thumbnailProp.files.length > 0) {
    const file = thumbnailProp.files[0];
    if (file.type === "external") {
      coverImage = file.external.url;
    } else if (file.type === "file") {
      coverImage = file.file.url;
    }
  } else if (page.cover) {
    if (page.cover.type === "external") {
      coverImage = page.cover.external.url;
    } else if (page.cover.type === "file") {
      coverImage = page.cover.file.url;
    }
  }

  // プロキシURLに変換
  coverImage = getProxiedImageUrl(coverImage);

  return {
    id: page.id,
    slug,
    title,
    subtitle,
    excerpt,
    coverImage,
    publishedAt,
    category,
  };
}

// Get all published blog posts (News) - 内部実装
async function fetchBlogPostsInternal(): Promise<BlogPost[]> {
  if (!notion || !newsDatabaseId) {
    console.warn("Notion API not configured - NOTION_API_KEY:", !!process.env.NOTION_API_KEY, "DATABASE_ID:", !!newsDatabaseId);
    return [];
  }

  try {
    // Try dataSources API first (2025-09-03), fallback to databases API
    let response;
    const dataSourceId = await getNewsDataSourceId();

    if (dataSourceId) {
      try {
        response = await withRetry(
          () => notion.dataSources.query({ data_source_id: dataSourceId }),
          "getBlogPosts:dataSources"
        );
      } catch (dsError) {
        console.warn("dataSources.query failed, falling back to databases.query:", dsError);
        const queryDb = getQueryDatabase();
        if (!queryDb) throw dsError;
        response = await withRetry(
          () => queryDb({ database_id: newsDatabaseId }),
          "getBlogPosts:databases"
        );
      }
    } else {
      // Fallback to traditional databases.query
      console.log("Using databases.query fallback for news");
      const queryDb = getQueryDatabase();
      if (!queryDb) return [];
      response = await withRetry(
        () => queryDb({ database_id: newsDatabaseId }),
        "getBlogPosts:fallback"
      );
    }

    const posts: BlogPost[] = [];
    for (const page of response.results) {
      if ("properties" in page) {
        const post = extractPageProperties(page as PageObjectResponse);
        if (post) {
          posts.push(post);
        }
      }
    }

    console.log(`Fetched ${posts.length} blog posts`);
    return posts;
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
}

// Get all published blog posts (News) - キャッシュなし（リアルタイム取得）
export const getBlogPosts = fetchBlogPostsInternal;

// Get a single blog post by slug
export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPostDetail | null> {
  if (!notion || !newsDatabaseId) {
    console.warn("Notion API not configured");
    return null;
  }

  try {
    // Try dataSources API first, fallback to databases API
    let response;
    const dataSourceId = await getNewsDataSourceId();

    if (dataSourceId) {
      try {
        response = await withRetry(
          () => notion.dataSources.query({ data_source_id: dataSourceId }),
          "getBlogPostBySlug:dataSources"
        );
      } catch (dsError) {
        console.warn("dataSources.query failed for slug lookup, falling back:", dsError);
        const queryDb = getQueryDatabase();
        if (!queryDb) throw dsError;
        response = await withRetry(
          () => queryDb({ database_id: newsDatabaseId }),
          "getBlogPostBySlug:databases"
        );
      }
    } else {
      const queryDb = getQueryDatabase();
      if (!queryDb) return null;
      response = await withRetry(
        () => queryDb({ database_id: newsDatabaseId }),
        "getBlogPostBySlug:fallback"
      );
    }

    // Find the page with matching slug
    let matchedPage: PageObjectResponse | null = null;
    for (const page of response.results) {
      if ("properties" in page) {
        const pageObj = page as PageObjectResponse;
        const properties = pageObj.properties;

        // Check slug (ページURL or Slug)
        const slugProp = properties["ページURL"] || properties["Slug"];
        let pageSlug = "";
        if (slugProp?.type === "rich_text") {
          pageSlug = extractRichText(slugProp.rich_text);
        }
        if (!pageSlug) {
          pageSlug = pageObj.id.replace(/-/g, "");
        }

        if (pageSlug === slug) {
          matchedPage = pageObj;
          break;
        }
      }
    }

    if (!matchedPage) {
      return null;
    }

    const post = extractPageProperties(matchedPage);

    if (!post) {
      return null;
    }

    // Get page blocks (content)
    const blocks = await getPageBlocks(matchedPage.id);

    // If no blocks, use the excerpt (本文 property) as fallback content
    let fallbackContent: string | undefined;
    if (blocks.length === 0 && post.excerpt) {
      // Convert plain text to HTML with line breaks
      fallbackContent = post.excerpt
        .split('\n')
        .map(line => line ? `<p>${line}</p>` : '<br>')
        .join('');
      console.log(`[News Detail] Using fallback content from 本文 property (${post.excerpt.length} chars)`);
    }

    return {
      ...post,
      blocks,
      fallbackContent,
    };
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
}

// Get page blocks (content)
async function getPageBlocks(pageId: string): Promise<BlockObjectResponse[]> {
  if (!notion) return [];

  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;

  try {
    do {
      const response = await withRetry(
        () => notion.blocks.children.list({
          block_id: pageId,
          start_cursor: cursor,
          page_size: 100,
        }),
        `getPageBlocks:${pageId.slice(0, 8)}`
      );

      for (const block of response.results) {
        if ("type" in block) {
          blocks.push(block as BlockObjectResponse);

          // Recursively get children for blocks that have children
          if (block.has_children) {
            const children = await getPageBlocks(block.id);
            (block as BlockObjectResponse & { children?: BlockObjectResponse[] }).children = children;
          }
        }
      }

      cursor = response.next_cursor ?? undefined;
    } while (cursor);

    return blocks;
  } catch (error) {
    console.error("Error fetching page blocks:", error);
    return [];
  }
}

// Get all slugs for static generation
export async function getAllBlogSlugs(): Promise<string[]> {
  const posts = await getBlogPosts();
  return posts.map((post) => post.slug);
}

// ============================================
// News (お知らせ) エイリアス
// ============================================

// getBlogPosts()のエイリアスとして提供
export async function getNews(): Promise<BlogPost[]> {
  return await getBlogPosts();
}

export async function getNewsBySlug(slug: string): Promise<BlogPostDetail | null> {
  return await getBlogPostBySlug(slug);
}

export async function getAllNewsSlugs(): Promise<string[]> {
  return await getAllBlogSlugs();
}

// ============================================
// Gallery (ギャラリー) 関連
// ============================================

// Types
export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string | null;
  order: number;
}

// Helper: Extract gallery item properties (日本語プロパティ名対応)
function extractGalleryProperties(page: PageObjectResponse): GalleryItem | null {
  const properties = page.properties;

  // タイトル (Title property) - 名前なしのtitle型を検索
  let title = "";
  for (const [, prop] of Object.entries(properties)) {
    if (prop.type === "title" && prop.title?.length > 0) {
      title = extractRichText(prop.title);
      break;
    }
  }
  // フォールバック: rich_textの「タイトル」「タイトル 」
  if (!title) {
    const titleProp = properties["タイトル"] || properties["タイトル "] || properties["Name"];
    if (titleProp?.type === "rich_text") {
      title = extractRichText(titleProp.rich_text);
    }
  }
  if (!title) return null;

  // 公開 (Published)
  const publishedProp = properties["公開"] || properties["Published"];
  if (publishedProp?.type === "checkbox" && !publishedProp.checkbox) return null;

  // カテゴリー (Category) - 長音ありの「カテゴリー」に対応
  const categoryProp = properties["カテゴリー"] || properties["カテゴリ"] || properties["Category"];
  let category = "";
  if (categoryProp?.type === "select" && categoryProp.select) {
    category = categoryProp.select.name;
  }
  // 説明文をカテゴリの代わりに使用（フォールバック）
  if (!category) {
    const descProp = properties["説明文"];
    if (descProp?.type === "rich_text") {
      category = extractRichText(descProp.rich_text);
    }
  }

  // Order - なければ0
  const orderProp = properties["Order"];
  const order =
    orderProp?.type === "number" && orderProp.number !== null
      ? orderProp.number
      : 0;

  // 画像 (Image) - filesプロパティ、画像URL、またはページカバーから取得
  let image: string | null = null;
  const imageProp = properties["画像"];
  const imageUrlProp = properties["画像URL"];

  if (imageProp?.type === "files" && imageProp.files.length > 0) {
    const file = imageProp.files[0];
    if (file.type === "external") {
      image = file.external.url;
    } else if (file.type === "file") {
      image = file.file.url;
    }
  } else if (imageUrlProp?.type === "rich_text") {
    image = extractRichText(imageUrlProp.rich_text) || null;
  } else if (page.cover) {
    if (page.cover.type === "external") {
      image = page.cover.external.url;
    } else if (page.cover.type === "file") {
      image = page.cover.file.url;
    }
  }

  // プロキシURLに変換
  image = getProxiedImageUrl(image);

  return {
    id: page.id,
    title,
    category,
    image,
    order,
  };
}

// Get all published gallery items - 内部実装
async function fetchGalleryItemsInternal(): Promise<GalleryItem[]> {
  if (!notion || !galleryDatabaseId) {
    console.warn("Notion Gallery API not configured - NOTION_API_KEY:", !!process.env.NOTION_API_KEY, "DATABASE_ID:", !!galleryDatabaseId);
    return [];
  }

  try {
    // Try dataSources API first, fallback to databases API
    let response;
    const dataSourceId = await getGalleryDataSourceId();

    if (dataSourceId) {
      try {
        response = await withRetry(
          () => notion.dataSources.query({ data_source_id: dataSourceId }),
          "getGalleryItems:dataSources"
        );
      } catch (dsError) {
        console.warn("dataSources.query failed for gallery, falling back:", dsError);
        const queryDb = getQueryDatabase();
        if (!queryDb) throw dsError;
        response = await withRetry(
          () => queryDb({ database_id: galleryDatabaseId }),
          "getGalleryItems:databases"
        );
      }
    } else {
      console.log("Using databases.query fallback for gallery");
      const queryDb = getQueryDatabase();
      if (!queryDb) return [];
      response = await withRetry(
        () => queryDb({ database_id: galleryDatabaseId }),
        "getGalleryItems:fallback"
      );
    }

    const items: GalleryItem[] = [];
    for (const page of response.results) {
      if ("properties" in page) {
        const item = extractGalleryProperties(page as PageObjectResponse);
        if (item) {
          items.push(item);
        }
      }
    }

    console.log(`Fetched ${items.length} gallery items`);
    return items;
  } catch (error) {
    console.error("Error fetching gallery items:", error);
    return [];
  }
}

// Get all published gallery items - キャッシュなし（リアルタイム取得）
export const getGalleryItems = fetchGalleryItemsInternal;

// ============================================
// Products (商品) 関連
// ============================================

// Types
export interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string;
  image: string | null;
  order: number;
}

// Get data_source_id for Products database
async function getProductsDataSourceId(): Promise<string | null> {
  if (cachedProductsDataSourceId) return cachedProductsDataSourceId;
  if (!notion || !productsDatabaseId) return null;

  try {
    const database = await withRetry(
      () => notion.databases.retrieve({ database_id: productsDatabaseId }) as Promise<DatabaseObjectResponse>,
      "getProductsDataSourceId"
    );

    if (database.data_sources && database.data_sources.length > 0) {
      cachedProductsDataSourceId = database.data_sources[0].id;
      return cachedProductsDataSourceId;
    }
    return null;
  } catch (error) {
    console.error("Error fetching products data source id:", error);
    return null;
  }
}

// Helper: Extract product properties (日本語プロパティ名対応)
function extractProductProperties(page: PageObjectResponse): Product | null {
  const properties = page.properties;

  // 商品名 (Title property)
  const nameProp = properties["商品名"] || properties["Name"];
  if (nameProp?.type !== "title") return null;
  const name = extractRichText(nameProp.title);

  // 公開 (Published)
  const publishedProp = properties["公開"] || properties["Published"];
  if (publishedProp?.type === "checkbox" && !publishedProp.checkbox) return null;

  // 価格 (Price) - number型またはrich_text型
  const priceProp = properties["価格"] || properties["Price"];
  let price = "";
  if (priceProp?.type === "number" && priceProp.number !== null) {
    price = `¥${priceProp.number.toLocaleString()}`;
  } else if (priceProp?.type === "rich_text") {
    price = extractRichText(priceProp.rich_text);
  }

  // 商品カテゴリ (Category)
  const categoryProp = properties["商品カテゴリ"] || properties["Category"];
  const category =
    categoryProp?.type === "select" && categoryProp.select
      ? categoryProp.select.name
      : "";

  // 説明文 (Description)
  const descriptionProp = properties["説明文"] || properties["Description"];
  const description =
    descriptionProp?.type === "rich_text"
      ? extractRichText(descriptionProp.rich_text)
      : "";

  // Order - なければ0
  const orderProp = properties["Order"];
  const order =
    orderProp?.type === "number" && orderProp.number !== null
      ? orderProp.number
      : 0;

  // 画像 (Image) - filesプロパティまたはページカバーから取得
  let image: string | null = null;
  const imageProp = properties["画像"];
  if (imageProp?.type === "files" && imageProp.files.length > 0) {
    const file = imageProp.files[0];
    if (file.type === "external") {
      image = file.external.url;
    } else if (file.type === "file") {
      image = file.file.url;
    }
  } else if (page.cover) {
    if (page.cover.type === "external") {
      image = page.cover.external.url;
    } else if (page.cover.type === "file") {
      image = page.cover.file.url;
    }
  }

  // プロキシURLに変換
  image = getProxiedImageUrl(image);

  return {
    id: page.id,
    name,
    price,
    category,
    description,
    image,
    order,
  };
}

// Get all published products - 内部実装
async function fetchProductsInternal(): Promise<Product[]> {
  if (!notion || !productsDatabaseId) {
    console.warn("Notion Products API not configured - NOTION_API_KEY:", !!process.env.NOTION_API_KEY, "DATABASE_ID:", !!productsDatabaseId);
    return [];
  }

  try {
    // Try dataSources API first, fallback to databases API
    let response;
    const dataSourceId = await getProductsDataSourceId();

    if (dataSourceId) {
      try {
        response = await withRetry(
          () => notion.dataSources.query({ data_source_id: dataSourceId }),
          "getProducts:dataSources"
        );
      } catch (dsError) {
        console.warn("dataSources.query failed for products, falling back:", dsError);
        const queryDb = getQueryDatabase();
        if (!queryDb) throw dsError;
        response = await withRetry(
          () => queryDb({ database_id: productsDatabaseId }),
          "getProducts:databases"
        );
      }
    } else {
      console.log("Using databases.query fallback for products");
      const queryDb = getQueryDatabase();
      if (!queryDb) return [];
      response = await withRetry(
        () => queryDb({ database_id: productsDatabaseId }),
        "getProducts:fallback"
      );
    }

    const products: Product[] = [];
    for (const page of response.results) {
      if ("properties" in page) {
        const product = extractProductProperties(page as PageObjectResponse);
        if (product) {
          products.push(product);
        }
      }
    }

    console.log(`Fetched ${products.length} products`);
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// Get all published products - キャッシュなし（リアルタイム取得）
export const getProducts = fetchProductsInternal;

// ============================================
// ニュースページの更新機能（Webhook用）
// ============================================

// ニュースページのステータスを更新
export async function updateNewsPageStatus(
  pageId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  if (!notion) {
    return { success: false, error: "Notion API not configured" };
  }

  try {
    await withRetry(
      () =>
        notion.pages.update({
          page_id: pageId,
          properties: {
            // ステータスプロパティ（SelectまたはStatus型）
            "ステータス": {
              select: { name: status },
            },
          },
        }),
      `updateNewsPageStatus:${pageId.slice(0, 8)}`
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to update news page status:", error);
    return { success: false, error: String(error) };
  }
}

// ニュースページをIDで取得（メール送信用）
export async function getNewsPageById(pageId: string): Promise<BlogPost | null> {
  if (!notion) {
    return null;
  }

  try {
    const page = await withRetry(
      () => notion.pages.retrieve({ page_id: pageId }) as Promise<PageObjectResponse>,
      `getNewsPageById:${pageId.slice(0, 8)}`
    );

    if (!("properties" in page)) {
      return null;
    }

    return extractPageProperties(page);
  } catch (error) {
    console.error("Failed to get news page:", error);
    return null;
  }
}

// ============================================
// ニュースレター配信先オプション同期
// ============================================

// 基本セグメント（手動で追加するオプション）
const BASE_SEGMENTS = [
  "すべて",
  "新規顧客",
  "リピーター",
  "最近来店",
  "休眠顧客",
  "予約あり",
];

// カテゴリ別オプションのサフィックス
const CATEGORY_USED_SUFFIX = "利用あり";
const CATEGORY_NOT_USED_SUFFIX = "利用なし";

// データベースプロパティの型定義（SDK v5対応）
interface DatabasePropertiesResponse {
  properties: Record<string, {
    type: string;
    multi_select?: {
      options: Array<{ id?: string; name: string; color?: string }>;
    };
    [key: string]: unknown;
  }>;
}

/**
 * Notionデータベースの「配信先」マルチセレクトオプションを更新
 * カテゴリ別オプション（[カテゴリ名]利用あり/なし）を自動同期
 */
export async function syncNewsletterTargetOptions(
  categories: { id: string; name: string }[]
): Promise<{ success: boolean; error?: string; added: string[] }> {
  if (!notion || !newsDatabaseId) {
    return { success: false, error: "Notion API not configured", added: [] };
  }

  try {
    // SDK v5/API 2025-09-03では databases.retrieve が properties を返さないため、
    // 直接 update で「配信先」プロパティを追加/更新する
    console.log("[Newsletter Sync] Updating database properties directly...");

    // 基本オプション + カテゴリオプションを作成
    const allOptions = [
      { name: "すべて", color: "blue" as const },
      { name: "管理者", color: "purple" as const },
      { name: "新規顧客", color: "green" as const },
      { name: "リピーター", color: "yellow" as const },
      { name: "最近来店", color: "orange" as const },
      { name: "休眠顧客", color: "red" as const },
      { name: "予約あり", color: "pink" as const },
    ];

    // カテゴリ別オプションを追加
    for (const category of categories) {
      allOptions.push({ name: `${category.name}${CATEGORY_USED_SUFFIX}`, color: "green" as const });
      allOptions.push({ name: `${category.name}${CATEGORY_NOT_USED_SUFFIX}`, color: "red" as const });
    }

    const updateParams = {
      database_id: newsDatabaseId,
      properties: {
        "配信先": {
          multi_select: {
            options: allOptions,
          },
        },
      },
    };

    await withRetry(
      () => (notion.databases.update as (params: typeof updateParams) => Promise<unknown>)(updateParams),
      "syncNewsletterTargetOptions:update"
    );

    const addedNames = allOptions.map((opt) => opt.name);
    console.log(`[Newsletter Sync] Updated property with ${addedNames.length} options`);
    return { success: true, added: addedNames };
  } catch (error) {
    console.error("[Newsletter Sync] Error:", error);
    return { success: false, error: String(error), added: [] };
  }
}

/**
 * ニュースページから「配信先」プロパティを取得
 */
export async function getNewsletterTargets(pageId: string): Promise<string[]> {
  if (!notion) {
    return [];
  }

  try {
    const page = await withRetry(
      () => notion.pages.retrieve({ page_id: pageId }) as Promise<PageObjectResponse>,
      `getNewsletterTargets:${pageId.slice(0, 8)}`
    );

    if (!("properties" in page)) {
      return [];
    }

    const targetProp = page.properties["配信先"];
    if (targetProp?.type !== "multi_select") {
      console.warn("[Newsletter] 配信先プロパティが見つかりません");
      return [];
    }

    return targetProp.multi_select.map((opt) => opt.name);
  } catch (error) {
    console.error("[Newsletter] Error fetching targets:", error);
    return [];
  }
}

// Notionクライアントをエクスポート（直接操作用）
export { notion as notionClient };
