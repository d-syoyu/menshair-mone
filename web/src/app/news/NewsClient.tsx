'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, type Variants } from 'framer-motion';
import { ArrowRight, Calendar, ChevronDown } from 'lucide-react';
import type { BlogPost } from '@/lib/notion';

// 初期表示件数
const INITIAL_DISPLAY_COUNT = 6;
const LOAD_MORE_COUNT = 6;

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }
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

const categoryColors: Record<string, string> = {
  'お知らせ': 'bg-accent/20 text-accent-light',
  '新メニュー': 'bg-gold/20 text-gold',
  'キャンペーン': 'bg-pink-500/20 text-pink-400',
};

interface NewsClientProps {
  news: BlogPost[];
}

export default function NewsClient({ news }: NewsClientProps) {
  const [filter, setFilter] = useState<string>('all');
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  // Get unique categories
  const categories = ['all', ...new Set(news.map((item) => item.category).filter(Boolean))];

  // Filter items
  const filteredNews = filter === 'all' ? news : news.filter((item) => item.category === filter);

  // Pagination
  const visibleNews = filteredNews.slice(0, displayCount);
  const hasMore = displayCount < filteredNews.length;
  const remainingCount = filteredNews.length - displayCount;

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + LOAD_MORE_COUNT, filteredNews.length));
  };

  // Reset display count when filter changes
  const handleFilterChange = (cat: string) => {
    setFilter(cat);
    setDisplayCount(INITIAL_DISPLAY_COUNT);
  };

  return (
    <>
      {/* Category Filter */}
      {categories.length > 1 && (
        <section className="container-narrow pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleFilterChange(cat)}
                className={`px-4 py-2 text-sm tracking-wider transition-all duration-300 ${
                  filter === cat
                    ? 'bg-accent text-white'
                    : 'bg-glass border border-glass-border text-text-secondary hover:border-accent/50 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'すべて' : cat}
              </button>
            ))}
          </motion.div>
        </section>
      )}

      {/* News List */}
      <AnimatedSection className="py-20 section-dark">
        <div className="container-narrow relative z-10">
          {filteredNews.length === 0 ? (
            <div className="text-center py-20 text-text-muted">
              <p>現在、公開中のお知らせはありません。</p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {visibleNews.map((item) => (
                  <motion.article
                    key={item.id}
                    variants={fadeInUp}
                  >
                    <Link
                      href={`/news/${item.slug}`}
                      className="block glass-card overflow-hidden group cursor-pointer hover:border-accent/30 transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Image */}
                        {item.coverImage && (
                          <div className="relative w-full md:w-80 h-56 md:h-auto md:aspect-[4/3] flex-shrink-0 overflow-hidden">
                            <img
                              src={item.coverImage}
                              alt={item.title}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 p-6 md:p-8">
                          {/* Date & Category */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-text-muted" />
                              <time className="text-sm text-text-muted tracking-wider">{item.publishedAt}</time>
                            </div>
                            {item.category && (
                              <span className={`px-3 py-1 text-[10px] tracking-[0.1em] uppercase ${categoryColors[item.category] || 'bg-glass text-text-secondary'}`}>
                                {item.category}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h2 className="text-xl md:text-2xl font-serif mb-2 group-hover:text-accent-light transition-colors">
                            {item.title}
                          </h2>

                          {/* Subtitle */}
                          {item.subtitle && (
                            <p className="text-sm md:text-base text-text-secondary">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>

              {/* もっと見るボタン */}
              {hasMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-10 text-center"
                >
                  <button
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 px-8 py-3 border border-glass-border text-text-secondary hover:text-white hover:border-accent transition-all duration-300 group"
                  >
                    <span className="text-sm tracking-wider">
                      もっと見る（残り {remainingCount} 件）
                    </span>
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                  </button>
                </motion.div>
              )}

              {/* 全件表示時のメッセージ */}
              {!hasMore && filteredNews.length > INITIAL_DISPLAY_COUNT && (
                <p className="mt-8 text-center text-sm text-text-muted">
                  全 {filteredNews.length} 件を表示中
                </p>
              )}
            </>
          )}
        </div>
      </AnimatedSection>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-dark via-dark-gray to-dark" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent opacity-[0.02] blur-[120px]" />
        </div>

        <div className="container-narrow text-center relative z-10">
          <p className="text-subheading mb-4">Reservation</p>
          <h2 className="text-heading mb-6">ご予約はこちら</h2>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-body max-w-lg mx-auto mb-10">
            Web予約またはお電話にて<br />
            ご予約を承っております。
          </p>
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
    </>
  );
}
