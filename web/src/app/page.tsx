'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView, type Variants } from 'framer-motion';
import { ArrowRight, Leaf, Sparkles, Clock, MapPin } from 'lucide-react';

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

// Section component with scroll animation
function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

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

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  const heroImageScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.1]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[var(--color-cream)]">

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <motion.div
          style={{ scale: heroImageScale }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="/full.png"
            alt="LUMINA HAIR STUDIO サロン内観"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-cream)]/70 via-[var(--color-cream)]/40 to-[var(--color-cream)]" />
        </motion.div>

        <motion.div style={{ y: heroTextY, opacity: heroOpacity }} className="relative z-10 text-center px-6">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-subheading mb-8"
          >
            LUMINA HAIR STUDIO
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-display mb-6"
          >
            <span className="block">あなたの美しさを</span>
            <span className="block italic text-[var(--color-charcoal)] drop-shadow-sm">引き出す</span>
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="divider-line mx-auto mb-8"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-[var(--color-warm-gray)] max-w-md mx-auto mb-12 font-light"
          >
            自然由来の成分と熟練の技術で<br />
            心と髪に優しいサロン体験を
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/contact" className="btn-primary">
              ご予約はこちら
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/menu" className="btn-outline">
              メニューを見る
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[1px] h-16 bg-gradient-to-b from-[var(--color-charcoal)] to-transparent"
          />
        </motion.div>
      </section>

      {/* Concept Section */}
      <AnimatedSection className="py-32 md:py-40">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Image */}
            <motion.div variants={fadeInUp} className="relative">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src="/seet.png"
                  alt="LUMINA HAIR STUDIO スタイリングステーション"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Decorative frame */}
              <div className="absolute -bottom-6 -right-6 w-full h-full border border-[var(--color-gold)] -z-10" />
            </motion.div>

            {/* Content */}
            <div className="lg:pl-8">
              <motion.p variants={fadeInUp} className="text-subheading mb-4">
                Our Concept
              </motion.p>
              <motion.h2 variants={fadeInUp} className="text-heading mb-8">
                自然と調和する<br />
                <span className="italic">美しさ</span>を
              </motion.h2>
              <motion.div variants={fadeInUp} className="divider-line mb-8" />
              <motion.p variants={fadeInUp} className="text-[var(--color-warm-gray)] mb-6 leading-relaxed">
                私たちのサロンは、オーガニック成分と環境に配慮した製品を使用し、
                お客様の髪本来の美しさを引き出すことを大切にしています。
              </motion.p>
              <motion.p variants={fadeInUp} className="text-[var(--color-warm-gray)] mb-10 leading-relaxed">
                熟練のスタイリストが一人ひとりの髪質や骨格を見極め、
                あなただけの最適なスタイルをご提案いたします。
              </motion.p>
              <motion.div variants={fadeInUp}>
                <Link href="/staff" className="group inline-flex items-center gap-2 text-[var(--color-charcoal)] font-medium">
                  <span className="border-b border-[var(--color-charcoal)] pb-1 group-hover:border-[var(--color-sage)] transition-colors">
                    スタッフを見る
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Services Section */}
      <AnimatedSection className="py-32 bg-[var(--color-cream-dark)]">
        <div className="container-wide">
          <div className="text-center mb-20">
            <motion.p variants={fadeInUp} className="text-subheading mb-4">
              Services
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-heading mb-6">
              メニュー
            </motion.h2>
            <motion.div variants={fadeInUp} className="divider-line mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: <Leaf className="w-8 h-8" />,
                title: 'Cut',
                titleJa: 'カット',
                price: '¥5,500〜',
                description: '骨格や髪質を見極め、似合うスタイルをご提案',
                image: '/cut.png'
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: 'Color',
                titleJa: 'カラー',
                price: '¥6,600〜',
                description: 'イルミナカラー・バレイヤージュなど豊富なメニュー',
                image: '/color.png'
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: 'Hair Improvement',
                titleJa: '髪質改善',
                price: '¥11,000〜',
                description: '酸熱トリートメント・TOKIOで美髪へ導く',
                image: '/treatments.png'
              }
            ].map((service) => (
              <motion.div
                key={service.title}
                variants={fadeInUp}
                className="group relative bg-[var(--color-cream)] overflow-hidden transition-all duration-500 hover:shadow-xl"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.titleJa}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-8">
                  <p className="text-xs tracking-[0.2em] text-[var(--color-sage)] mb-2">
                    {service.title}
                  </p>
                  <h3 className="text-2xl font-[family-name:var(--font-serif)] mb-2">
                    {service.titleJa}
                  </h3>
                  <p className="text-xl text-[var(--color-gold)] font-light mb-4">
                    {service.price}
                  </p>
                  <p className="text-sm text-[var(--color-warm-gray)] leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Hover accent */}
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-gold)] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeInUp} className="text-center mt-16">
            <Link href="/menu" className="btn-primary">
              全てのメニューを見る
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Stylists Section */}
      <AnimatedSection className="py-32">
        <div className="container-wide">
          <div className="text-center mb-20">
            <motion.p variants={fadeInUp} className="text-subheading mb-4">
              Stylists
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-heading mb-6">
              スタッフ紹介
            </motion.h2>
            <motion.div variants={fadeInUp} className="divider-line mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {[
              {
                name: '山田 花子',
                role: 'Director',
                image: '/person1.png',
                description: '15年のキャリアを持つトップスタイリスト'
              },
              {
                name: '佐藤 美咲',
                role: 'Top Stylist',
                image: '/person2.png',
                description: 'カラーリングのスペシャリスト'
              }
            ].map((stylist) => (
              <motion.div
                key={stylist.name}
                variants={fadeInUp}
                className="group"
              >
                <div className="relative aspect-[3/4] overflow-hidden mb-6">
                  <Image
                    src={stylist.image}
                    alt={stylist.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <p className="text-xs tracking-[0.2em] text-[var(--color-sage)] mb-2 uppercase">
                  {stylist.role}
                </p>
                <h3 className="text-xl font-[family-name:var(--font-serif)] mb-2">
                  {stylist.name}
                </h3>
                <p className="text-sm text-[var(--color-warm-gray)]">
                  {stylist.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeInUp} className="text-center mt-16">
            <Link href="/staff" className="btn-outline">
              全てのスタッフを見る
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Features Section */}
      <AnimatedSection className="py-32 bg-[var(--color-cream-dark)]">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {[
              {
                number: '01',
                title: 'オーガニック製品',
                description: '厳選された自然由来成分を使用。髪と頭皮に優しい施術をお約束します。'
              },
              {
                number: '02',
                title: '完全予約制',
                description: 'お一人おひとりに十分な時間を確保。落ち着いた空間でリラックスいただけます。'
              },
              {
                number: '03',
                title: '丁寧なカウンセリング',
                description: 'ライフスタイルやお悩みをしっかりヒアリング。最適なスタイルをご提案。'
              }
            ].map((feature) => (
              <motion.div key={feature.number} variants={fadeInUp} className="relative">
                <span className="text-7xl font-[family-name:var(--font-serif)] text-[var(--color-light-gray)] absolute -top-4 -left-2">
                  {feature.number}
                </span>
                <div className="pt-12 pl-8">
                  <h3 className="text-xl mb-4">{feature.title}</h3>
                  <p className="text-[var(--color-warm-gray)] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Access Section */}
      <AnimatedSection className="py-32 bg-[var(--color-charcoal)] text-white">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.p variants={fadeInUp} className="text-xs tracking-[0.3em] uppercase text-[var(--color-sage-light)] mb-4">
                Access
              </motion.p>
              <motion.h2 variants={fadeInUp} className="text-heading text-white mb-8">
                サロン情報
              </motion.h2>
              <motion.div variants={fadeInUp} className="w-16 h-[1px] bg-[var(--color-gold)] mb-10" />

              <motion.div variants={fadeInUp} className="space-y-8">
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-[var(--color-sage-light)] mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-2">Address</p>
                    <p className="text-lg">東京都渋谷区神宮前1-2-3</p>
                    <p className="text-sm text-gray-400 mt-1">表参道駅 A1出口より徒歩3分</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-[var(--color-sage-light)] mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-2">Hours</p>
                    <div className="space-y-2">
                      <div className="flex justify-between max-w-xs">
                        <span>平日</span>
                        <span className="text-gray-300">10:00 - 20:00</span>
                      </div>
                      <div className="flex justify-between max-w-xs">
                        <span>土日祝</span>
                        <span className="text-gray-300">9:00 - 19:00</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">定休日: 毎週火曜日</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-12">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[var(--color-charcoal)] text-sm tracking-[0.2em] uppercase transition-all duration-500 hover:bg-[var(--color-sage)] hover:text-white"
                >
                  ご予約・お問い合わせ
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>

            {/* Map image */}
            <motion.div variants={fadeInUp} className="relative aspect-square lg:aspect-[4/3] overflow-hidden">
              <Image
                src="/counter.png"
                alt="LUMINA HAIR STUDIO 受付カウンター"
                fill
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white transition-all duration-300 hover:bg-white hover:text-[var(--color-charcoal)]"
                >
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm tracking-[0.15em]">Google Mapsで開く</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="py-32 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/full.png"
            alt="LUMINA HAIR STUDIO サロン内装"
            fill
            className="object-cover opacity-15"
          />
        </div>

        <div className="container-narrow relative z-10 text-center">
          <motion.p variants={fadeInUp} className="text-subheading mb-4">
            Reservation
          </motion.p>
          <motion.h2 variants={fadeInUp} className="text-heading mb-6">
            ご予約をお待ちしております
          </motion.h2>
          <motion.div variants={fadeInUp} className="divider-line mx-auto mb-8" />
          <motion.p variants={fadeInUp} className="text-[var(--color-warm-gray)] max-w-lg mx-auto mb-12">
            当サロンは完全予約制となっております。<br />
            お電話またはオンラインフォームよりご予約ください。
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-primary">
              オンライン予約
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="tel:03-1234-5678" className="btn-outline">
              03-1234-5678
            </a>
          </motion.div>
        </div>
      </AnimatedSection>

    </div>
  );
}
