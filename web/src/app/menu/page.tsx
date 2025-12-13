'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

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

const menuCategories = [
  {
    id: 'cut',
    title: 'Cut',
    titleJa: 'カット',
    description: '骨格や髪質を見極め、お客様一人ひとりに似合うスタイルをご提案いたします。',
    image: '/cut.png',
    items: [
      { name: 'カット', price: '¥5,500' },
      { name: '前髪カット', price: '¥1,100' },
      { name: 'キッズカット（小学生以下）', price: '¥3,300' },
    ]
  },
  {
    id: 'color',
    title: 'Color',
    titleJa: 'カラー',
    description: 'オーガニック成分配合のカラー剤を使用。繰り返すほどに髪にツヤが生まれます。',
    image: '/color.png',
    items: [
      { name: 'フルカラー', price: '¥8,800' },
      { name: 'リタッチカラー', price: '¥6,600' },
      { name: 'イルミナカラー', price: '¥11,000' },
      { name: 'ハイライト', price: '¥5,500〜' },
      { name: 'グレイカラー（白髪染め）', price: '¥7,700' },
    ]
  },
  {
    id: 'perm',
    title: 'Perm',
    titleJa: 'パーマ',
    description: 'ダメージを最小限に抑えながら、理想のカールを長持ちさせます。',
    image: '/treatments.png',
    items: [
      { name: 'パーマ', price: '¥8,800' },
      { name: 'デジタルパーマ', price: '¥13,200' },
      { name: 'コスメパーマ', price: '¥11,000' },
      { name: 'ポイントパーマ', price: '¥5,500〜' },
    ]
  },
  {
    id: 'straightening',
    title: 'Straightening',
    titleJa: '縮毛矯正',
    description: 'くせ毛やうねりを根本から改善し、自然でまっすぐなストレートヘアを実現します。',
    image: '/treatments.png',
    items: [
      { name: '縮毛矯正', price: '¥17,600〜' },
      { name: 'ポイント縮毛矯正（前髪）', price: '¥5,500' },
      { name: '酸性ストレート', price: '¥22,000' },
    ]
  },
  {
    id: 'hair-improvement',
    title: 'Hair Improvement',
    titleJa: '髪質改善',
    description: '最新の技術で髪の内部構造を整え、本来の美しさを取り戻します。',
    image: '/treatments.png',
    items: [
      { name: '髪質改善トリートメント', price: '¥11,000' },
      { name: '酸熱トリートメント', price: '¥16,500' },
      { name: 'TOKIO インカラミ', price: '¥8,800' },
    ]
  },
  {
    id: 'treatment',
    title: 'Treatment',
    titleJa: 'トリートメント',
    description: '髪の内部からダメージを補修し、艶やかでまとまりのある髪へ導きます。',
    image: '/treatments.png',
    items: [
      { name: 'クイックトリートメント', price: '¥2,200' },
      { name: 'スペシャルトリートメント', price: '¥4,400' },
      { name: 'プレミアムトリートメント', price: '¥6,600' },
    ]
  },
  {
    id: 'spa',
    title: 'Head Spa',
    titleJa: 'ヘッドスパ',
    description: '頭皮のコリをほぐし、リラックスしながら健やかな髪の土台を育てます。',
    image: '/treatments.png',
    items: [
      { name: 'クイックスパ（15分）', price: '¥2,200' },
      { name: 'リラックススパ（30分）', price: '¥4,400' },
      { name: 'プレミアムスパ（45分）', price: '¥6,600' },
    ]
  },
  {
    id: 'arrangement',
    title: 'Hair Arrange',
    titleJa: 'ヘアセット',
    description: '特別な日を彩るヘアセット。結婚式やパーティー、成人式などに。',
    image: '/color.png',
    items: [
      { name: 'ヘアセット', price: '¥5,500' },
      { name: '成人式ヘアセット', price: '¥8,800' },
      { name: 'ブライダルヘアメイク', price: '¥33,000〜' },
    ]
  },
  {
    id: 'set-menu',
    title: 'Set Menu',
    titleJa: 'セットメニュー',
    description: '人気メニューをお得に組み合わせたセットプランをご用意しております。',
    image: '/color.png',
    items: [
      { name: 'カット + カラー', price: '¥12,100' },
      { name: 'カット + パーマ', price: '¥12,100' },
      { name: 'カット + 髪質改善', price: '¥14,300' },
      { name: '美髪フルコース（カット+カラー+髪質改善+スパ）', price: '¥27,500' },
    ]
  },
  {
    id: 'goods',
    title: 'Products',
    titleJa: '店販商品',
    description: 'サロン専売品やLUMINAオリジナルのヘアケア商品を取り揃えております。',
    image: '/goods.png',
    items: [
      { name: 'シャンプー', price: '¥3,300〜' },
      { name: 'トリートメント', price: '¥3,850〜' },
      { name: 'ヘアオイル', price: '¥2,750〜' },
    ]
  },
];

export default function MenuPage() {
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
          <p className="text-subheading mb-4">Price List</p>
          <h1 className="text-display mb-6">Menu</h1>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-[var(--color-warm-gray)] max-w-lg mx-auto">
            すべての施術にシャンプー・ブローが含まれております。<br />
            ご不明な点はお気軽にお問い合わせください。
          </p>
        </motion.div>
      </section>

      {/* Menu Categories */}
      {menuCategories.map((category, index) => (
        <AnimatedSection
          key={category.id}
          className={`py-20 ${index % 2 === 1 ? 'bg-[var(--color-cream-dark)]' : ''}`}
        >
          <div className="container-wide">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              {/* Image */}
              <motion.div
                variants={fadeInUp}
                className={`relative ${index % 2 === 1 ? 'lg:order-2' : ''}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.titleJa}
                    fill
                    className="object-cover"
                  />
                </div>
                {index % 2 === 0 && (
                  <div className="absolute -bottom-4 -right-4 w-full h-full border border-[var(--color-gold)] -z-10" />
                )}
                {index % 2 === 1 && (
                  <div className="absolute -bottom-4 -left-4 w-full h-full border border-[var(--color-sage)] -z-10" />
                )}
              </motion.div>

              {/* Content */}
              <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                <motion.p variants={fadeInUp} className="text-subheading mb-2">
                  {category.title}
                </motion.p>
                <motion.h2 variants={fadeInUp} className="text-heading mb-6">
                  {category.titleJa}
                </motion.h2>
                <motion.div variants={fadeInUp} className="divider-line mb-6" />
                <motion.p variants={fadeInUp} className="text-[var(--color-warm-gray)] mb-10 leading-relaxed">
                  {category.description}
                </motion.p>

                {/* Price List */}
                <div className="space-y-4">
                  {category.items.map((item) => (
                    <motion.div
                      key={item.name}
                      variants={fadeInUp}
                      className="flex justify-between items-center py-3 border-b border-[var(--color-light-gray)]"
                    >
                      <span className="text-[var(--color-charcoal)]">{item.name}</span>
                      <span className="text-[var(--color-gold)] font-light text-lg">{item.price}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      ))}

      {/* Note */}
      <section className="py-20 bg-[var(--color-charcoal)] text-white">
        <div className="container-narrow text-center">
          <h2 className="text-2xl font-[family-name:var(--font-serif)] mb-6">ご予約について</h2>
          <div className="w-12 h-[1px] bg-[var(--color-gold)] mx-auto mb-8" />
          <div className="text-gray-300 space-y-4 mb-10">
            <p>表示価格はすべて税込です。</p>
            <p>初回のお客様には丁寧なカウンセリングを行うため、<br className="hidden md:inline" />お時間に余裕を持ってお越しください。</p>
            <p>メニューの組み合わせにより、セット割引もございます。</p>
          </div>
          <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[var(--color-charcoal)] text-sm tracking-[0.2em] uppercase transition-all duration-500 hover:bg-[var(--color-sage)] hover:text-white">
            ご予約はこちら
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
