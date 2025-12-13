'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const galleryImages = [
  { src: '/cut.jpeg', alt: 'カット' },
  { src: '/cut2.jpeg', alt: 'カット' },
  { src: '/shampoo2.jpeg', alt: 'ヘッドスパ' },
  { src: '/shampoo.jpeg', alt: 'シャンプー' },
  { src: '/design.jpeg', alt: 'デザイン' },
];

const menuCategories = [
  {
    id: 'cut',
    titleJa: 'カット',
    items: [
      { name: 'カット', price: '¥4,950', duration: '40分' },
      { name: 'カット + シャンプー', price: '¥5,500', duration: '50分' },
    ]
  },
  {
    id: 'color',
    titleJa: 'カラー',
    items: [
      { name: 'カラー', price: '¥4,950〜', duration: '60分〜' },
      { name: 'カット + カラー', price: '¥8,800', duration: '90分' },
    ]
  },
  {
    id: 'perm',
    titleJa: 'パーマ',
    items: [
      { name: 'パーマ', price: '¥4,400〜', duration: '60分〜' },
      { name: 'カット + パーマ', price: '¥8,250', duration: '90分' },
    ]
  },
  {
    id: 'straightening',
    titleJa: '縮毛矯正',
    items: [
      { name: '縮毛矯正', price: '¥11,000〜', duration: '120分〜' },
      { name: 'カット + 縮毛矯正', price: '¥14,850', duration: '150分' },
    ]
  },
  {
    id: 'spa',
    titleJa: 'スパ',
    items: [
      { name: 'ヘッドスパ', price: '¥2,200〜', duration: '30分〜' },
    ]
  },
  {
    id: 'shampoo-set',
    titleJa: 'シャンプー&セット',
    items: [
      { name: 'シャンプー&セット', price: '¥2,200', duration: '20分' },
    ]
  },
  {
    id: 'mens-shaving',
    titleJa: 'メンズシェービング',
    items: [
      { name: 'フェイスシェービング', price: '¥2,200', duration: '20分' },
      { name: 'カット + シェービング', price: '¥6,050', duration: '60分' },
    ]
  },
  {
    id: 'ladies-shaving',
    titleJa: 'レディースシェービング',
    items: [
      { name: 'フェイスシェービング', price: '¥3,300', duration: '30分' },
      { name: 'フルシェービング', price: '¥5,500', duration: '40分' },
    ]
  },
];

export default function MenuPage() {
  return (
    <div className="min-h-screen pt-32">
      {/* Hero */}
      <section className="container-wide pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="text-subheading mb-4">Price List</p>
          <h1 className="text-display mb-6">Menu</h1>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-body max-w-lg mx-auto">
            すべての施術はプライベート空間で<br />
            丁寧にご提供いたします。
          </p>
        </motion.div>
      </section>

      {/* Menu List with Gallery */}
      <section className="py-12 section-gradient">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left: Gallery (モバイル: 上、デスクトップ: 左側固定) */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-32">
                <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                  {galleryImages.map((image, index) => (
                    <motion.div
                      key={image.src}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="relative aspect-[4/3] min-w-[200px] lg:min-w-0 overflow-hidden glass-card group"
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Menu List */}
            <div className="lg:col-span-8 space-y-10">
              {menuCategories.map((category) => (
                <div key={category.id} className="space-y-4">
                  <h2 className="text-2xl font-serif text-white border-b border-glass-border pb-3">
                    {category.titleJa}
                  </h2>

                  <div className="space-y-3">
                    {category.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex flex-wrap justify-between items-center py-2 text-text-secondary hover:text-white transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <span className="text-base">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-text-muted">
                            {item.duration}
                          </span>
                          <span className="text-lg text-gold font-light min-w-[100px] text-right">{item.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Note & CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-dark-gray via-dark to-dark-gray" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent opacity-[0.02] blur-[120px]" />
        </div>

        <div className="container-narrow text-center relative z-10">
          <h2 className="text-2xl font-serif mb-6">ご予約について</h2>
          <div className="divider-line mx-auto mb-8" />
          <div className="text-body space-y-4 mb-10">
            <p>表示価格はすべて税込です。</p>
            <p>初回のお客様には丁寧なカウンセリングを行うため、<br className="hidden md:inline" />お時間に余裕を持ってお越しください。</p>
            <p>メニューの組み合わせにより、セット割引もございます。</p>
          </div>
          <Link href="/booking" className="btn-primary">
            ご予約はこちら
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
