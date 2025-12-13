'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const menuCategories = [
  {
    id: 'cut',
    titleJa: 'カット',
    titleEn: 'Cut',
    items: [
      { name: 'カット', price: '¥4,950', duration: '40分' },
      { name: 'カット＋ケアSV', price: '¥5,500', duration: '50分' },
      { name: 'カット＋メンズエステSV', price: '¥7,150', duration: '60分' },
      { name: 'カット＋メンズエステSV〜美顔器エステ〜', price: '¥8,800', duration: '70分' },
      { name: 'フェードカット', price: '¥5,500', duration: '50分' },
      { name: 'フェードカット＋ケアSV', price: '¥6,050', duration: '60分' },
      { name: 'フェードカット＋メンズエステSV', price: '¥7,700', duration: '70分' },
      { name: 'フェードカット＋メンズエステSV〜美顔器エステ〜', price: '¥9,350', duration: '80分' },
      { name: 'ジュニア', price: '¥2,420', duration: '30分' },
      { name: '小学生', price: '¥2,970', duration: '30分' },
      { name: '中学生', price: '¥3,520', duration: '35分' },
      { name: '高校生', price: '¥4,070', duration: '40分' },
    ]
  },
  {
    id: 'color',
    titleJa: 'カラー',
    titleEn: 'Color',
    items: [
      { name: 'カラー', price: '¥4,950〜', duration: '60分〜' },
      { name: '白髪染', price: '¥4,400〜', duration: '60分〜' },
      { name: '白髪ぼかし', price: '¥3,850', duration: '45分' },
      { name: 'ブリーチ', price: '¥7,150〜', duration: '90分〜' },
      { name: 'ハイライト・メッシュ', price: '¥7,150〜', duration: '90分〜' },
    ]
  },
  {
    id: 'perm',
    titleJa: 'パーマ',
    titleEn: 'Perm',
    items: [
      { name: 'ポイントパーマ', price: '¥4,400', duration: '60分' },
      { name: 'デザインパーマ', price: '¥7,700〜', duration: '90分〜' },
      { name: 'スパイラルパーマ', price: '¥7,700〜', duration: '90分〜' },
      { name: 'ツイスト・波巻き系パーマ', price: '¥10,450〜', duration: '120分〜' },
      { name: 'アイロンパーマハーフ', price: '¥4,400', duration: '60分' },
      { name: 'アイロンパーマ', price: '¥7,700', duration: '90分' },
      { name: 'ボリュームダウンパーマ', price: '¥4,400', duration: '60分' },
    ]
  },
  {
    id: 'straight',
    titleJa: '縮毛矯正',
    titleEn: 'Straight Perm',
    items: [
      { name: 'フロント矯正', price: '¥4,400', duration: '90分' },
      { name: 'フロント＋サイド', price: '¥6,600', duration: '120分' },
      { name: '全頭矯正', price: '¥11,000〜', duration: '150分〜' },
    ]
  },
  {
    id: 'spa',
    titleJa: 'スパ＆トリートメント',
    titleEn: 'Spa & Treatment',
    items: [
      { name: 'もみほぐしクレンジングSPA', price: '¥2,200', duration: '30分' },
      { name: '頭皮エイジング予防ヘッドスパ〜皮脂・フケ・ニオイ改善〜', price: '¥4,400', duration: '50分' },
      { name: 'とろとろスパミルクの頭皮柔らかトリートメントスパ', price: '¥2,200', duration: '30分' },
      { name: 'オーガニックノートシステムトリートメント3step', price: '¥3,300', duration: '40分' },
      { name: 'オーガニックノートシステムトリートメント5step', price: '¥5,500', duration: '60分' },
      { name: '魔法のナノバブル', price: '¥1,100', duration: '15分' },
    ]
  },
  {
    id: 'shampoo-set',
    titleJa: 'シャンプー＆セット',
    titleEn: 'Sp & Set',
    items: [
      { name: 'シャンプーブロー', price: '¥1,650', duration: '20分' },
      { name: 'ヘアセット', price: '¥1,100', duration: '15分' },
    ]
  },
  {
    id: 'mens-sv',
    titleJa: 'メンズシェービング',
    titleEn: "Men's SV",
    items: [
      { name: 'ケアSV', price: '¥2,200', duration: '25分' },
      { name: 'メンズエステSV', price: '¥3,850', duration: '35分' },
      { name: 'メンズエステSV〜美顔器エステ〜', price: '¥5,500', duration: '45分' },
      { name: 'ノーズワックス', price: '¥1,000', duration: '10分' },
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

      {/* Menu List */}
      <section className="py-12 section-gradient">
        <div className="container-narrow">
          <div className="space-y-10 md:space-y-12">
            {menuCategories.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <div className="border-b border-glass-border pb-3">
                  <h2 className="text-xl md:text-2xl font-serif text-white">{category.titleEn}</h2>
                </div>

                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex flex-wrap sm:flex-nowrap justify-between items-start sm:items-center py-3 text-text-secondary hover:text-white transition-colors"
                    >
                      <div className="w-full sm:w-auto sm:flex-1 sm:min-w-0 sm:mr-4 mb-2 sm:mb-0">
                        <span className="text-base md:text-lg">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="text-sm text-text-muted whitespace-nowrap">
                          {item.duration}
                        </span>
                        <span className="text-lg md:text-xl text-gold font-light min-w-[100px] text-right">{item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
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
