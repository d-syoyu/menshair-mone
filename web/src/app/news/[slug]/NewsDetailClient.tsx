"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import NotionRenderer from "@/components/blog/NotionRenderer";
import type { BlogPostDetail } from "@/lib/notion";

const categoryColors: Record<string, string> = {
  'お知らせ': 'bg-accent/20 text-accent-light',
  '新メニュー': 'bg-gold/20 text-gold',
  'キャンペーン': 'bg-pink-500/20 text-pink-400',
};

interface NewsDetailClientProps {
  post: BlogPostDetail & { fallbackContent?: string };
}

export default function NewsDetailClient({ post }: NewsDetailClientProps) {
  const hasNotionContent = post.blocks && post.blocks.length > 0;

  return (
    <div className="min-h-screen pt-32">
      {/* Content */}
      <article className="container-narrow pb-6 md:pb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-card p-8 md:p-12"
        >
          {/* Back link */}
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent-light transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            お知らせ一覧へ戻る
          </Link>

          {/* Meta */}
          <div className="flex items-center gap-4 mb-6">
            {post.category && (
              <span className={`px-3 py-1 text-[10px] tracking-[0.1em] uppercase ${categoryColors[post.category] || 'bg-glass text-text-secondary'}`}>
                {post.category}
              </span>
            )}
            {post.publishedAt && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Calendar className="w-4 h-4" />
                <time>{post.publishedAt}</time>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-serif mb-4">
            {post.title}
          </h1>

          {/* Subtitle */}
          {post.subtitle && (
            <p className="text-lg text-text-secondary mb-8">
              {post.subtitle}
            </p>
          )}

          <div className="w-16 h-[1px] bg-accent mb-8" />

          {/* Content */}
          {hasNotionContent ? (
            <NotionRenderer blocks={post.blocks} />
          ) : post.fallbackContent ? (
            <div
              className="prose prose-invert prose-lg max-w-none
                prose-headings:font-serif
                prose-headings:text-white
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-text-secondary prose-p:leading-relaxed
                prose-ul:text-text-secondary
                prose-li:my-2
                prose-strong:text-white prose-strong:font-medium"
              dangerouslySetInnerHTML={{ __html: post.fallbackContent }}
            />
          ) : (
            <p className="text-text-muted">
              コンテンツがありません。
            </p>
          )}

          {/* Cover Image (if exists) */}
          {post.coverImage && (
            <div className="relative w-full aspect-[16/9] mt-10 overflow-hidden rounded-lg shadow-xl">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
        </motion.div>
      </article>

      {/* CTA */}
      <section className="py-10 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-dark via-dark-gray to-dark" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent opacity-[0.02] blur-[120px]" />
        </div>

        <div className="container-narrow text-center relative z-10">
          <p className="text-subheading mb-4">Reservation</p>
          <h2 className="text-heading mb-6">ご予約はこちら</h2>
          <div className="divider-line mx-auto mb-8" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking" className="btn-primary">
              Web予約する
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="tel:06-6908-4859" className="btn-outline">
              06-6908-4859
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
