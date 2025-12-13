// src/lib/notion.ts
// Notion API Client and Helper Functions (2025-09-03 API)

import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
  DatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

// Notion Client - only create if API key is set
// SDK v5 uses 2025-09-03 API by default
const notion = process.env.NOTION_API_KEY
  ? new Client({ auth: process.env.NOTION_API_KEY })
  : null;

const databaseId = process.env.NOTION_DATABASE_ID;
const productsDatabaseId = process.env.NOTION_PRODUCTS_DATABASE_ID;

// Cache for data_source_id (avoids repeated API calls)
let cachedDataSourceId: string | null = null;
let cachedProductsDataSourceId: string | null = null;

// Get data_source_id from database (required for 2025-09-03 API)
async function getDataSourceId(): Promise<string | null> {
  if (cachedDataSourceId) return cachedDataSourceId;
  if (!notion || !databaseId) return null;

  try {
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    }) as DatabaseObjectResponse;

    if (database.data_sources && database.data_sources.length > 0) {
      cachedDataSourceId = database.data_sources[0].id;
      return cachedDataSourceId;
    }
    return null;
  } catch (error) {
    console.error("Error fetching data source id:", error);
    return null;
  }
}

// Types
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
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

// Helper: Extract page properties
function extractPageProperties(page: PageObjectResponse): BlogPost | null {
  const properties = page.properties;

  // Title
  const titleProp = properties["Title"];
  if (titleProp?.type !== "title") return null;
  const title = extractRichText(titleProp.title);

  // Slug
  const slugProp = properties["Slug"];
  if (slugProp?.type !== "rich_text") return null;
  const slug = extractRichText(slugProp.rich_text);
  if (!slug) return null;

  // Published
  const publishedProp = properties["Published"];
  if (publishedProp?.type !== "checkbox" || !publishedProp.checkbox) return null;

  // PublishedAt
  const publishedAtProp = properties["PublishedAt"];
  const publishedAt =
    publishedAtProp?.type === "date" && publishedAtProp.date
      ? formatDate(publishedAtProp.date.start)
      : "";

  // Excerpt
  const excerptProp = properties["Excerpt"];
  const excerpt =
    excerptProp?.type === "rich_text"
      ? extractRichText(excerptProp.rich_text)
      : "";

  // Category
  const categoryProp = properties["Category"];
  const category =
    categoryProp?.type === "select" && categoryProp.select
      ? categoryProp.select.name
      : "";

  // Cover Image
  let coverImage: string | null = null;
  if (page.cover) {
    if (page.cover.type === "external") {
      coverImage = page.cover.external.url;
    } else if (page.cover.type === "file") {
      coverImage = page.cover.file.url;
    }
  }

  return {
    id: page.id,
    slug,
    title,
    excerpt,
    coverImage,
    publishedAt,
    category,
  };
}

// Get all published blog posts
export async function getBlogPosts(): Promise<BlogPost[]> {
  if (!notion || !databaseId) {
    console.warn("Notion API not configured");
    return [];
  }

  try {
    // Get data_source_id (required for 2025-09-03 API)
    const dataSourceId = await getDataSourceId();
    if (!dataSourceId) {
      console.warn("Could not retrieve data_source_id");
      return [];
    }

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: "Published",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: "PublishedAt",
          direction: "descending",
        },
      ],
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
  if (!notion || !databaseId) {
    console.warn("Notion API not configured");
    return null;
  }

  try {
    // Get data_source_id (required for 2025-09-03 API)
    const dataSourceId = await getDataSourceId();
    if (!dataSourceId) {
      console.warn("Could not retrieve data_source_id");
      return null;
    }

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        and: [
          {
            property: "Slug",
            rich_text: {
              equals: slug,
            },
          },
          {
            property: "Published",
            checkbox: {
              equals: true,
            },
          },
        ],
      },
    });

    if (response.results.length === 0) {
      return null;
    }

    const page = response.results[0] as PageObjectResponse;
    const post = extractPageProperties(page);

    if (!post) {
      return null;
    }

    // Get page blocks (content)
    const blocks = await getPageBlocks(page.id);

    return {
      ...post,
      blocks,
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
// News (お知らせ) 関連
// ============================================

// お知らせはブログと同じデータベースを使用
// getBlogPosts()のエイリアスとして提供
export async function getNews(): Promise<BlogPost[]> {
  return await getBlogPosts();
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
}

// Get data_source_id for products database
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

// Helper: Extract product properties
function extractProductProperties(page: PageObjectResponse): Product | null {
  const properties = page.properties;

  // Name (Title property)
  const nameProp = properties["Name"];
  if (nameProp?.type !== "title") return null;
  const name = extractRichText(nameProp.title);

  // Published
  const publishedProp = properties["Published"];
  if (publishedProp?.type !== "checkbox" || !publishedProp.checkbox) return null;

  // Price
  const priceProp = properties["Price"];
  const price =
    priceProp?.type === "rich_text"
      ? extractRichText(priceProp.rich_text)
      : "";

  // Category
  const categoryProp = properties["Category"];
  const category =
    categoryProp?.type === "select" && categoryProp.select
      ? categoryProp.select.name
      : "";

  // Description
  const descriptionProp = properties["Description"];
  const description =
    descriptionProp?.type === "rich_text"
      ? extractRichText(descriptionProp.rich_text)
      : "";

  // Cover Image
  let image: string | null = null;
  if (page.cover) {
    if (page.cover.type === "external") {
      image = page.cover.external.url;
    } else if (page.cover.type === "file") {
      image = page.cover.file.url;
    }
  }

  return {
    id: page.id,
    name,
    price,
    category,
    description,
    image,
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
      filter: {
        property: "Published",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: "Order",
          direction: "ascending",
        },
      ],
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
