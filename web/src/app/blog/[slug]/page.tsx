// src/app/blog/[slug]/page.tsx
// Blog detail page - Server Component with Notion integration

import { notFound } from "next/navigation";
import { getBlogPostBySlug, getAllBlogSlugs, type BlogPostDetail } from "@/lib/notion";
import BlogDetailClient from "./BlogDetailClient";

export const revalidate = 60; // Revalidate every 60 seconds

// Fallback data when Notion is not configured
const fallbackPosts: Record<string, BlogPostDetail> = {
  "spring-hair-trends-2024": {
    id: "1",
    slug: "spring-hair-trends-2024",
    title: "2024年春のヘアトレンド",
    publishedAt: "2024.03.15",
    category: "トレンド",
    coverImage: "/white_home.png",
    excerpt: "春らしい軽やかなスタイルと、トレンドカラーをご紹介。",
    blocks: [],
    fallbackContent: `
      <p>暖かな日差しが心地よい季節となりました。ヘアスタイルも衣替えをして、気分を一新しませんか？</p>
      <p>今春は、透明感のあるハイライトや、柔らかいウェーブスタイルが人気です。写真のような抜け感のあるスタイルは、顔周りを明るく見せてくれる効果も。</p>
      <h3>今季のトレンドスタイル</h3>
      <ul>
        <li><strong>ナチュラルハイライト:</strong> 細かいハイライトで立体感と透明感を演出。</li>
        <li><strong>ゆるふわウェーブ:</strong> 柔らかいウェーブで女性らしい印象に。</li>
        <li><strong>レイヤーカット:</strong> 動きのあるスタイルで軽やかに。</li>
      </ul>
      <p>MONËでは、お客様の髪質やライフスタイルに合わせた最適なスタイルをご提案いたします。ぜひご相談ください。</p>
    `,
  },
  "staff-recommend-products": {
    id: "2",
    slug: "staff-recommend-products",
    title: "スタッフおすすめ！ホームケア商品",
    publishedAt: "2024.03.01",
    category: "ヘアケア",
    coverImage: "/white_goods.png",
    excerpt: "サロンクオリティの髪を自宅でも。",
    blocks: [],
    fallbackContent: `
      <p>サロンでのケアはもちろん大切ですが、毎日のホームケアが美髪を保つ鍵です。今回は、MONËオリジナルのヘアケア商品をご紹介します。</p>
      <p>当サロンでは、オーガニック成分を配合したオリジナルのシャンプー、トリートメント、ヘアオイルを取り揃えております。</p>
      <h3>MONËオリジナル商品</h3>
      <ul>
        <li><strong>MONËシャンプー:</strong> アミノ酸系洗浄成分で優しく洗い上げます。</li>
        <li><strong>MONËトリートメント:</strong> 天然由来成分で髪の内部から補修。</li>
        <li><strong>MONËヘアオイル:</strong> ラベンダーの香りで、自然なツヤとまとまりを。</li>
      </ul>
      <p>サロンでお試しいただけますので、お気軽にスタッフまでお声がけください。</p>
    `,
  },
  "headspa-benefits": {
    id: "3",
    slug: "headspa-benefits",
    title: "ヘッドスパの効果と魅力",
    publishedAt: "2024.02.20",
    category: "メニュー紹介",
    coverImage: "/white_shampoo.png",
    excerpt: "リラックス効果だけじゃない！",
    blocks: [],
    fallbackContent: `
      <p>MONËのヘッドスパは、スチームを使った本格的な施術で、髪と頭皮の両方をケアします。</p>
      <p>温かいスチームで毛穴を開き、頭皮の汚れを優しく取り除きながら、トリートメント成分を髪の深部まで届けます。施術中はリラックスした時間をお過ごしいただけます。</p>
      <h3>MONËヘッドスパの特徴</h3>
      <ul>
        <li><strong>スチームケア:</strong> 温かいスチームで頭皮を柔らかくし、汚れを浮かせます。</li>
        <li><strong>頭皮マッサージ:</strong> 熟練のスタッフによる丁寧なマッサージで血行促進。</li>
        <li><strong>トリートメント浸透:</strong> スチームの力で美容成分が髪の内部まで届きます。</li>
      </ul>
      <p>日頃の疲れを癒しながら、美しい髪を手に入れませんか？</p>
    `,
  },
  "salon-renewal": {
    id: "4",
    slug: "salon-renewal",
    title: "サロンリニューアルのお知らせ",
    publishedAt: "2024.02.01",
    category: "お知らせ",
    coverImage: "/white_home.png",
    excerpt: "待合スペースをリニューアルしました。",
    blocks: [],
    fallbackContent: `
      <p>いつもMONËをご利用いただき、誠にありがとうございます。</p>
      <p>この度、待合スペースをリニューアルいたしました。温かみのある家具とグリーンを配した、よりリラックスできる空間に生まれ変わりました。</p>
      <h3>リニューアルポイント</h3>
      <ul>
        <li><strong>ソファの新調:</strong> ゆったりとお待ちいただける快適なソファを導入。</li>
        <li><strong>グリーンの設置:</strong> 観葉植物を配し、癒しの空間を演出。</li>
        <li><strong>雑誌・書籍の充実:</strong> 最新のファッション誌やライフスタイル誌をご用意。</li>
      </ul>
      <p>施術前のひとときを、より快適にお過ごしいただければ幸いです。皆様のご来店を心よりお待ちしております。</p>
    `,
  },
};

// Generate static params for known slugs
export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();

  // Include fallback slugs if Notion is not configured
  if (slugs.length === 0) {
    return Object.keys(fallbackPosts).map((slug) => ({ slug }));
  }

  return slugs.map((slug) => ({ slug }));
}

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;

  // Try to fetch from Notion first
  let post = await getBlogPostBySlug(slug);

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

  return <BlogDetailClient post={post} />;
}
