"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import NotionRenderer from "@/components/blog/NotionRenderer";
import type { BlogPostDetail } from "@/lib/notion";

interface BlogDetailClientProps {
  post: BlogPostDetail & { fallbackContent?: string };
}

export default function BlogDetailClient({ post }: BlogDetailClientProps) {
  const hasNotionContent = post.blocks && post.blocks.length > 0;

  return (
    <div className="min-h-screen bg-[var(--color-cream)] pt-32">
      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[50vh] min-h-[400px]"
      >
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
            unoptimized={post.coverImage.startsWith("http")}
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-sage)]/20" />
        )}
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
            {post.category && (
              <span className="px-3 py-1 bg-[var(--color-cream)] text-xs tracking-[0.1em]">
                {post.category}
              </span>
            )}
            {post.publishedAt && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-warm-gray)]">
                <Calendar className="w-4 h-4" />
                <time>{post.publishedAt}</time>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-serif)] mb-8">
            {post.title}
          </h1>

          <div className="w-16 h-[1px] bg-[var(--color-gold)] mb-8" />

          {/* Content */}
          {hasNotionContent ? (
            <NotionRenderer blocks={post.blocks} />
          ) : post.fallbackContent ? (
            <div
              className="prose prose-lg max-w-none
                prose-headings:font-[family-name:var(--font-serif)]
                prose-headings:text-[var(--color-charcoal)]
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-[var(--color-warm-gray)] prose-p:leading-relaxed
                prose-ul:text-[var(--color-warm-gray)]
                prose-li:my-2
                prose-strong:text-[var(--color-charcoal)] prose-strong:font-medium"
              dangerouslySetInnerHTML={{ __html: post.fallbackContent }}
            />
          ) : (
            <p className="text-[var(--color-warm-gray)]">
              コンテンツがありません。
            </p>
          )}
        </motion.div>
      </article>

      {/* CTA */}
      <section className="py-20 bg-[var(--color-cream-dark)]">
        <div className="container-narrow text-center">
          <p className="text-subheading mb-4">Reservation</p>
          <h2 className="text-heading mb-6">ご予約をお待ちしております</h2>
          <div className="divider-line mx-auto mb-8" />
          <Link href="/booking" className="btn-primary">
            ご予約はこちら
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
