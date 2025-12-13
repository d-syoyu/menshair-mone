'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, type Variants } from 'framer-motion';
import { ArrowRight, Calendar } from 'lucide-react';
import type { BlogPost } from '@/lib/notion';

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
  return (
    <>
      {/* News List */}
      <AnimatedSection className="py-20 section-dark">
        <div className="container-narrow relative z-10">
          <div className="space-y-6">
            {news.map((item) => (
              <motion.article
                key={item.id}
                variants={fadeInUp}
                className="glass-card p-6 md:p-8 group cursor-pointer hover:border-accent/30 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                  {/* Date */}
                  <div className="flex items-center gap-2 md:w-32 flex-shrink-0">
                    <Calendar className="w-4 h-4 text-text-muted" />
                    <time className="text-sm text-text-muted tracking-wider">{item.publishedAt}</time>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 text-[10px] tracking-[0.1em] uppercase ${categoryColors[item.category] || 'bg-glass text-text-secondary'}`}>
                        {item.category}
                      </span>
                    </div>
                    <h2 className="text-xl font-serif mb-3 group-hover:text-accent-light transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-body line-clamp-2">
                      {item.excerpt}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex items-center">
                    <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-accent-light group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Pagination placeholder */}
          <motion.div variants={fadeInUp} className="flex justify-center gap-2 mt-12">
            <span className="w-10 h-10 flex items-center justify-center bg-accent text-white text-sm">1</span>
            <span className="w-10 h-10 flex items-center justify-center border border-glass-border text-text-muted text-sm hover:border-accent hover:text-white transition-colors cursor-pointer">2</span>
            <span className="w-10 h-10 flex items-center justify-center border border-glass-border text-text-muted text-sm hover:border-accent hover:text-white transition-colors cursor-pointer">3</span>
          </motion.div>
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
