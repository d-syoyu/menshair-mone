'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView, type Variants } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.section>
  );
}

const blogPosts = [
  {
    slug: 'spring-hair-trends-2024',
    title: '2024年春のヘアトレンド',
    date: '2024.03.15',
    category: 'トレンド',
    image: '/blog2.png',
    excerpt: '春らしい軽やかなスタイルと、トレンドカラーをご紹介。今季注目のヘアスタイルをチェック。',
  },
  {
    slug: 'staff-recommend-products',
    title: 'スタッフおすすめ！ホームケア商品',
    date: '2024.03.01',
    category: 'ヘアケア',
    image: '/blog1.png',
    excerpt: 'サロンクオリティの髪を自宅でも。LUMINAオリジナルのシャンプー＆トリートメントをご紹介。',
  },
  {
    slug: 'headspa-benefits',
    title: 'ヘッドスパの効果と魅力',
    date: '2024.02.20',
    category: 'メニュー紹介',
    image: '/blog4.png',
    excerpt: 'リラックス効果だけじゃない！ヘッドスパがもたらす髪と頭皮への嬉しい効果とは。',
  },
  {
    slug: 'salon-renewal',
    title: 'サロンリニューアルのお知らせ',
    date: '2024.02.01',
    category: 'お知らせ',
    image: '/blog3.png',
    excerpt: '待合スペースをリニューアルしました。より快適な空間でお待ちいただけます。',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[var(--color-cream)] pt-32">
      {/* Hero */}
      <section className="container-wide pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="text-subheading mb-4">News & Tips</p>
          <h1 className="text-display mb-6">Blog</h1>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-[var(--color-warm-gray)] max-w-lg mx-auto">
            最新のお知らせやヘアケア情報、<br />
            トレンドスタイルをお届けします
          </p>
        </motion.div>
      </section>

      {/* Blog List */}
      <AnimatedSection className="pb-32">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <motion.article
                key={post.slug}
                variants={fadeInUp}
                className="group"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden mb-6">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 text-xs tracking-[0.1em] text-[var(--color-charcoal)]">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex items-center gap-2 text-[var(--color-warm-gray)] text-sm mb-3">
                    <Calendar className="w-4 h-4" />
                    <time>{post.date}</time>
                  </div>

                  <h2 className="text-xl font-[family-name:var(--font-serif)] mb-3 group-hover:text-[var(--color-sage-dark)] transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-sm text-[var(--color-warm-gray)] leading-relaxed mb-4">
                    {post.excerpt}
                  </p>

                  <span className="inline-flex items-center gap-2 text-sm text-[var(--color-charcoal)] group-hover:text-[var(--color-sage)] transition-colors">
                    続きを読む
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* CTA */}
      <section className="py-20 bg-[var(--color-cream-dark)]">
        <div className="container-narrow text-center">
          <p className="text-subheading mb-4">Follow Us</p>
          <h2 className="text-heading mb-6">最新情報をお届け</h2>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-[var(--color-warm-gray)] max-w-lg mx-auto mb-10">
            Instagramでは、スタイル写真やサロンの日常を発信中。<br />
            ぜひフォローしてください。
          </p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Instagramをフォロー
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
