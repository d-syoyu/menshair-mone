// src/app/news/[slug]/page.tsx
// News detail page - Server Component with Notion integration

import { notFound } from "next/navigation";
import { getNewsBySlug, getAllNewsSlugs, type BlogPostDetail } from "@/lib/notion";
import NewsDetailClient from "./NewsDetailClient";

export const revalidate = 60; // Revalidate every 60 seconds

// Fallback data when Notion is not configured
const fallbackPosts: Record<string, BlogPostDetail> = {
  "year-end-notice": {
    id: "1",
    slug: "year-end-notice",
    title: "年末年始の営業時間のお知らせ",
    publishedAt: "2025.12.10",
    category: "お知らせ",
    coverImage: null,
    excerpt: "年末年始の営業時間についてお知らせいたします。",
    blocks: [],
    fallbackContent: `
      <p>いつもMONËをご利用いただき、誠にありがとうございます。</p>
      <p>年末年始の営業時間についてお知らせいたします。</p>
      <h3>年末年始休業期間</h3>
      <p><strong>2025年12月30日（月）〜 2026年1月3日（金）</strong></p>
      <p>上記期間中は休業とさせていただきます。</p>
      <h3>年始営業開始</h3>
      <p><strong>2026年1月4日（土）</strong>より通常営業いたします。</p>
      <p>ご不便をおかけいたしますが、何卒ご了承くださいますようお願い申し上げます。</p>
      <p>年明けも皆様のご来店を心よりお待ちしております。</p>
    `,
  },
  "new-premium-headspa": {
    id: "2",
    slug: "new-premium-headspa",
    title: "新メニュー「プレミアムヘッドスパ」登場",
    publishedAt: "2025.12.01",
    category: "新メニュー",
    coverImage: null,
    excerpt: "頭皮の深層からケアする新しいヘッドスパメニューが登場しました。",
    blocks: [],
    fallbackContent: `
      <p>お客様からのご要望にお応えし、新メニュー「プレミアムヘッドスパ」を導入いたしました。</p>
      <h3>プレミアムヘッドスパの特徴</h3>
      <ul>
        <li><strong>特別なアロマオイル:</strong> 高品質なエッセンシャルオイルを使用し、深いリラクゼーションを提供</li>
        <li><strong>頭皮診断:</strong> マイクロスコープによる頭皮診断を実施</li>
        <li><strong>60分のロングコース:</strong> じっくり時間をかけて頭皮と髪をケア</li>
        <li><strong>温冷療法:</strong> 血行促進と毛穴ケアを同時に</li>
      </ul>
      <h3>料金</h3>
      <p><strong>¥8,800</strong>（税込）/ 60分</p>
      <p>日頃のストレスを癒し、頭皮環境を整えたい方にぜひおすすめいたします。</p>
    `,
  },
  "website-renewal": {
    id: "3",
    slug: "website-renewal",
    title: "公式Webサイトをリニューアルしました",
    publishedAt: "2025.11.20",
    category: "お知らせ",
    coverImage: null,
    excerpt: "より使いやすく、見やすいWebサイトにリニューアルいたしました。",
    blocks: [],
    fallbackContent: `
      <p>このたび、MONËの公式Webサイトをリニューアルいたしました。</p>
      <h3>リニューアルのポイント</h3>
      <ul>
        <li><strong>スマートフォン対応:</strong> スマートフォンでも快適にご覧いただけるデザインに</li>
        <li><strong>オンライン予約:</strong> Webから24時間ご予約が可能に</li>
        <li><strong>メニュー・料金の見やすさ向上:</strong> サービス内容がより分かりやすく</li>
        <li><strong>ギャラリー追加:</strong> 店内の雰囲気やスタイル写真をご覧いただけます</li>
      </ul>
      <p>今後もお客様にとって使いやすいサイトを目指してまいります。</p>
      <p>ご意見・ご要望がございましたら、お気軽にお申し付けください。</p>
    `,
  },
};

// Generate static params for known slugs
export async function generateStaticParams() {
  const slugs = await getAllNewsSlugs();

  // Include fallback slugs if Notion is not configured
  if (slugs.length === 0) {
    return Object.keys(fallbackPosts).map((slug) => ({ slug }));
  }

  return slugs.map((slug) => ({ slug }));
}

interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;

  // Try to fetch from Notion first
  let post = await getNewsBySlug(slug);

  // Fall back to static data if not found in Notion
  if (!post) {
    const fallbackPost = fallbackPosts[slug];
    if (fallbackPost) {
      post = fallbackPost;
    }
  }

  if (!post) {
    notFound();
  }

  return <NewsDetailClient post={post} />;
}
