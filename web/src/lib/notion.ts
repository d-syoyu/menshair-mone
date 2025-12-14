// src/lib/notion.ts
// Notion API Client and Helper Functions (2025-09-03 API)

import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
  DatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { getProxiedImageUrl } from "./image-proxy";

// Notion Client - only create if API key is set
// SDK v5 uses 2025-09-03 API by default
const notion = process.env.NOTION_API_KEY
  ? new Client({ auth: process.env.NOTION_API_KEY })
  : null;

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
    const database = await notion.databases.retrieve({
      database_id: newsDatabaseId,
    }) as DatabaseObjectResponse;

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
    const database = await notion.databases.retrieve({
      database_id: galleryDatabaseId,
    }) as DatabaseObjectResponse;

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
  subtitle: string;
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
  const publishedProp = properties["公開"] || properties["Published"];
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

// Get all published blog posts (News)
export async function getBlogPosts(): Promise<BlogPost[]> {
  if (!notion || !newsDatabaseId) {
    console.warn("Notion API not configured");
    return [];
  }

  try {
    // Get data_source_id (required for 2025-09-03 API)
    const dataSourceId = await getNewsDataSourceId();
    if (!dataSourceId) {
      console.warn("Could not retrieve news data_source_id");
      return [];
    }

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
    });

    const posts: BlogPost[] = [];
    for (const page of response.results) {
      if ("properties" in page) {
        const post = extractPageProperties(page as PageObjectResponse);
        if (post) {
          posts.push(post);
        }
      }
    }

    return posts;
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
}

// Get a single blog post by slug
export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPostDetail | null> {
  if (!notion || !newsDatabaseId) {
    console.warn("Notion API not configured");
    return null;
  }

  try {
    // Get data_source_id (required for 2025-09-03 API)
    const dataSourceId = await getNewsDataSourceId();
    if (!dataSourceId) {
      console.warn("Could not retrieve news data_source_id");
      return null;
    }

    // Get all items and filter by slug in code (to avoid property name issues)
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
    });

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
      const response = await notion.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
        page_size: 100,
      });

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

  // タイトル (Title property)
  const nameProp = properties["タイトル"] || properties["Name"];
  if (nameProp?.type !== "title") return null;
  const title = extractRichText(nameProp.title);

  // 公開 (Published)
  const publishedProp = properties["公開"] || properties["Published"];
  if (publishedProp?.type === "checkbox" && !publishedProp.checkbox) return null;

  // カテゴリ (Category) - 説明文をカテゴリとして使用
  const categoryProp = properties["Category"] || properties["説明文"];
  let category = "";
  if (categoryProp?.type === "select" && categoryProp.select) {
    category = categoryProp.select.name;
  } else if (categoryProp?.type === "rich_text") {
    category = extractRichText(categoryProp.rich_text);
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

// Get all published gallery items
export async function getGalleryItems(): Promise<GalleryItem[]> {
  if (!notion || !galleryDatabaseId) {
    console.warn("Notion Gallery API not configured");
    return [];
  }

  try {
    // Get data_source_id (required for 2025-09-03 API)
    const dataSourceId = await getGalleryDataSourceId();
    if (!dataSourceId) {
      console.warn("Could not retrieve gallery data_source_id");
      return [];
    }

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
    });

    const items: GalleryItem[] = [];
    for (const page of response.results) {
      if ("properties" in page) {
        const item = extractGalleryProperties(page as PageObjectResponse);
        if (item) {
          items.push(item);
        }
      }
    }

    return items;
  } catch (error) {
    console.error("Error fetching gallery items:", error);
    return [];
  }
}

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
    const database = await notion.databases.retrieve({
      database_id: productsDatabaseId,
    }) as DatabaseObjectResponse;

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

// Get all published products
export async function getProducts(): Promise<Product[]> {
  if (!notion || !productsDatabaseId) {
    console.warn("Notion Products API not configured");
    return [];
  }

  try {
    // Get data_source_id (required for 2025-09-03 API)
    const dataSourceId = await getProductsDataSourceId();
    if (!dataSourceId) {
      console.warn("Could not retrieve products data_source_id");
      return [];
    }

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
    });

    const products: Product[] = [];
    for (const page of response.results) {
      if ("properties" in page) {
        const product = extractProductProperties(page as PageObjectResponse);
        if (product) {
          products.push(product);
        }
      }
    }

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}
