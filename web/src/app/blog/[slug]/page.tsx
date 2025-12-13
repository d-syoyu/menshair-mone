'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, ArrowLeft, ArrowRight } from 'lucide-react';

const blogPosts = [
  {
    slug: 'spring-hair-trends-2024',
    title: '2024年春のヘアトレンド',
    date: '2024.03.15',
    category: 'トレンド',
    image: '/blog2.png',
    content: `
      <p>暖かな日差しが心地よい季節となりました。ヘアスタイルも衣替えをして、気分を一新しませんか？</p>
      <p>今春は、透明感のあるハイライトや、柔らかいウェーブスタイルが人気です。写真のような抜け感のあるスタイルは、顔周りを明るく見せてくれる効果も。</p>
      <h3>今季のトレンドスタイル</h3>
      <ul>
        <li><strong>ナチュラルハイライト:</strong> 細かいハイライトで立体感と透明感を演出。</li>
        <li><strong>ゆるふわウェーブ:</strong> 柔らかいウェーブで女性らしい印象に。</li>
        <li><strong>レイヤーカット:</strong> 動きのあるスタイルで軽やかに。</li>
      </ul>
      <p>LUMINAでは、お客様の髪質やライフスタイルに合わせた最適なスタイルをご提案いたします。ぜひご相談ください。</p>
    `,
  },
  {
    slug: 'staff-recommend-products',
    title: 'スタッフおすすめ！ホームケア商品',
    date: '2024.03.01',
    category: 'ヘアケア',
    image: '/blog1.png',
    content: `
      <p>サロンでのケアはもちろん大切ですが、毎日のホームケアが美髪を保つ鍵です。今回は、LUMINAオリジナルのヘアケア商品をご紹介します。</p>
      <p>当サロンでは、オーガニック成分を配合したオリジナルのシャンプー、トリートメント、ヘアオイルを取り揃えております。</p>
      <h3>LUMINAオリジナル商品</h3>
      <ul>
        <li><strong>LUMINAシャンプー:</strong> アミノ酸系洗浄成分で優しく洗い上げます。</li>
        <li><strong>LUMINAトリートメント:</strong> 天然由来成分で髪の内部から補修。</li>
        <li><strong>LUMINAヘアオイル:</strong> ラベンダーの香りで、自然なツヤとまとまりを。</li>
      </ul>
      <p>サロンでお試しいただけますので、お気軽にスタッフまでお声がけください。</p>
    `,
  },
  {
    slug: 'headspa-benefits',
    title: 'ヘッドスパの効果と魅力',
    date: '2024.02.20',
    category: 'メニュー紹介',
    image: '/blog4.png',
    content: `
      <p>LUMINAのヘッドスパは、スチームを使った本格的な施術で、髪と頭皮の両方をケアします。</p>
      <p>温かいスチームで毛穴を開き、頭皮の汚れを優しく取り除きながら、トリートメント成分を髪の深部まで届けます。施術中はリラックスした時間をお過ごしいただけます。</p>
      <h3>LUMINAヘッドスパの特徴</h3>
      <ul>
        <li><strong>スチームケア:</strong> 温かいスチームで頭皮を柔らかくし、汚れを浮かせます。</li>
        <li><strong>頭皮マッサージ:</strong> 熟練のスタッフによる丁寧なマッサージで血行促進。</li>
        <li><strong>トリートメント浸透:</strong> スチームの力で美容成分が髪の内部まで届きます。</li>
      </ul>
      <p>日頃の疲れを癒しながら、美しい髪を手に入れませんか？</p>
    `,
  },
  {
    slug: 'salon-renewal',
    title: 'サロンリニューアルのお知らせ',
    date: '2024.02.01',
    category: 'お知らせ',
    image: '/blog3.png',
    content: `
      <p>いつもLUMINA HAIR STUDIOをご利用いただき、誠にありがとうございます。</p>
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
];

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] pt-32 pb-20">
        <div className="container-narrow text-center">
          <h1 className="text-heading mb-6">記事が見つかりません</h1>
          <Link href="/blog" className="btn-outline">
            <ArrowLeft className="w-4 h-4" />
            ブログ一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)] pt-32">
      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[50vh] min-h-[400px]"
      >
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--color-cream)]" />
      </motion.div>

      {/* Content */}
      <article className="container-narrow -mt-20 relative z-10 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white p-8 md:p-12"
        >
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-warm-gray)] hover:text-[var(--color-charcoal)] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            ブログ一覧へ戻る
          </Link>

          {/* Meta */}
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-[var(--color-cream)] text-xs tracking-[0.1em]">
              {post.category}
            </span>
            <div className="flex items-center gap-2 text-sm text-[var(--color-warm-gray)]">
              <Calendar className="w-4 h-4" />
              <time>{post.date}</time>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-serif)] mb-8">
            {post.title}
          </h1>

          <div className="w-16 h-[1px] bg-[var(--color-gold)] mb-8" />

          {/* Content */}
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-[family-name:var(--font-serif)]
              prose-headings:text-[var(--color-charcoal)]
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:text-[var(--color-warm-gray)] prose-p:leading-relaxed
              prose-ul:text-[var(--color-warm-gray)]
              prose-li:my-2
              prose-strong:text-[var(--color-charcoal)] prose-strong:font-medium"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </motion.div>
      </article>

      {/* CTA */}
      <section className="py-20 bg-[var(--color-cream-dark)]">
        <div className="container-narrow text-center">
          <p className="text-subheading mb-4">Reservation</p>
          <h2 className="text-heading mb-6">ご予約をお待ちしております</h2>
          <div className="divider-line mx-auto mb-8" />
          <Link href="/contact" className="btn-primary">
            ご予約はこちら
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
