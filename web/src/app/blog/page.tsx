// src/app/blog/page.tsx
// Blog listing page - Server Component with Notion integration

import { getBlogPosts, type BlogPost } from "@/lib/notion";
import BlogListClient from "./BlogListClient";

export const revalidate = 60; // Revalidate every 60 seconds

// Fallback data when Notion is not configured
const fallbackPosts: BlogPost[] = [
  {
    id: "1",
    slug: "spring-hair-trends-2024",
    title: "2024年春のヘアトレンド",
    publishedAt: "2024.03.15",
    category: "トレンド",
    coverImage: "/white_home.png",
    excerpt:
      "春らしい軽やかなスタイルと、トレンドカラーをご紹介。今季注目のヘアスタイルをチェック。",
  },
  {
    id: "2",
    slug: "staff-recommend-products",
    title: "スタッフおすすめ！ホームケア商品",
    publishedAt: "2024.03.01",
    category: "ヘアケア",
    coverImage: "/white_goods.png",
    excerpt:
      "サロンクオリティの髪を自宅でも。Hair Salon Whiteオリジナルのシャンプー＆トリートメントをご紹介。",
  },
  {
    id: "3",
    slug: "headspa-benefits",
    title: "ヘッドスパの効果と魅力",
    publishedAt: "2024.02.20",
    category: "メニュー紹介",
    coverImage: "/white_shampoo.png",
    excerpt:
      "リラックス効果だけじゃない！ヘッドスパがもたらす髪と頭皮への嬉しい効果とは。",
  },
  {
    id: "4",
    slug: "salon-renewal",
    title: "サロンリニューアルのお知らせ",
    publishedAt: "2024.02.01",
    category: "お知らせ",
    coverImage: "/white_home.png",
    excerpt:
      "待合スペースをリニューアルしました。より快適な空間でお待ちいただけます。",
  },
];

export default async function BlogPage() {
  // Fetch posts from Notion, fall back to static data if not configured
  let posts = await getBlogPosts();

  if (posts.length === 0) {
    posts = fallbackPosts;
  }

  return <BlogListClient posts={posts} />;
}
