'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView, type Variants } from 'framer-motion';
import { ArrowRight, Clock, MapPin, Calendar } from 'lucide-react';

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1 } }
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

// メニューデータ
const featuredMenus = [
  {
    title: 'Cut',
    titleJa: 'カット',
    price: '¥4,950〜',
    duration: '60分',
    description: '骨格や髪質を見極め、大人の男性に相応しいスタイルをご提案',
  },
  {
    title: 'Shaving',
    titleJa: 'シェービング',
    price: '¥2,200〜',
    duration: '15分〜',
    description: 'コラーゲン配合シェービングソープで清潔感のある印象を',
  },
  {
    title: 'Head Spa',
    titleJa: 'ヘッドスパ',
    price: '¥2,200〜',
    duration: '10分〜',
    description: '頭皮の血行を促進し、日々の疲れを癒す極上のリラクゼーション',
  },
  {
    title: 'Color',
    titleJa: 'カラー',
    price: '¥4,950〜',
    duration: '90分〜',
    description: 'デザインカット込みのカラーリングで理想のスタイルを実現',
  },
];

// お知らせデータ（ダミー）
const newsItems = [
  {
    date: '2025.12.10',
    title: '年末年始の営業時間のお知らせ',
  },
  {
    date: '2025.12.01',
    title: '新メニュー「プレミアムヘッドスパ」登場',
  },
  {
    date: '2025.11.20',
    title: '公式Webサイトをリニューアルしました',
  },
];

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  const heroTextY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen overflow-x-clip">

      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-screen md:h-screen flex items-center justify-center overflow-hidden overflow-x-clip pt-24 pb-12 md:pt-0 md:pb-0">
        {/* Ken Burns Background Images - Monochrome */}
        <div className="absolute inset-0 z-0 overflow-hidden overflow-x-clip">
          {/* Image 1 - Zoom In */}
          <div
            className="absolute inset-0 bg-cover bg-center ken-burns-1 grayscale"
            style={{ backgroundImage: 'url(/image1.jpeg)' }}
          />
          {/* Image 2 - Zoom Out */}
          <div
            className="absolute inset-0 bg-cover bg-center ken-burns-2 grayscale"
            style={{ backgroundImage: 'url(/image2.jpeg)' }}
          />
          {/* Image 3 - Pan */}
          <div
            className="absolute inset-0 bg-cover bg-center ken-burns-3 grayscale"
            style={{ backgroundImage: 'url(/image3.jpeg)' }}
          />

          {/* Overlay for text readability - adjusted for monochrome background */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/35 to-black/50" />

          {/* Accent glow effects - contained within viewport */}
          <div className="absolute top-1/4 left-[10%] w-[200px] md:w-[400px] h-[200px] md:h-[400px] rounded-full bg-accent opacity-[0.06] blur-[80px] md:blur-[100px]" />
          <div className="absolute bottom-1/3 right-[10%] w-[150px] md:w-[300px] h-[150px] md:h-[300px] rounded-full bg-gold opacity-[0.04] blur-[60px] md:blur-[80px]" />

          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
        </div>

        <motion.div style={{ y: heroTextY, opacity: heroOpacity }} className="relative z-10 text-center px-6">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-subheading mb-4 md:mb-8"
          >
            Men&apos;s Private Salon
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mb-6 md:mb-8"
          >
            <span className="text-display block mb-2 md:mb-4">
              一人一人の男性に
            </span>
            <span className="text-display block">
              <span className="text-accent-light">「光」</span>と<span className="text-gold">「印象」</span>を...
            </span>
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="divider-line mx-auto mb-6 md:mb-8"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-text-secondary max-w-lg mx-auto mb-8 md:mb-12 text-body"
          >
            守口市のメンズ専門プライベートサロン<br />
            大人の男性に上質な休息をご提供します
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
          >
            <Link href="/booking" className="btn-primary">
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
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:block"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[10px] tracking-[0.3em] text-text-muted uppercase">Scroll</span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-text-muted to-transparent" />
          </motion.div>
        </motion.div>
      </section>

      {/* Concept Section */}
      <AnimatedSection className="py-16 md:py-32 lg:py-40 section-gradient overflow-hidden">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 lg:gap-24 items-center">
            {/* Decorative Element */}
            <motion.div variants={fadeInUp} className="relative">
              <div className="relative aspect-[4/5] glass-card overflow-hidden">
                <Image
                  src="/entrance.jpeg"
                  alt="MONË店舗入口"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              {/* Decorative frame - hidden on mobile to prevent overflow */}
              <div className="hidden md:block absolute -bottom-4 -right-4 w-full h-full border border-accent/30 -z-10" />
              <div className="hidden md:block absolute -bottom-8 -right-8 w-full h-full border border-gold/20 -z-20" />
            </motion.div>

            {/* Content */}
            <div className="lg:pl-8">
              <motion.p variants={fadeInUp} className="text-subheading mb-4">
                Concept
              </motion.p>
              <motion.h2 variants={fadeInUp} className="text-heading mb-8">
                上質な休息を、<br />
                <span className="text-accent-light">あなたに。</span>
              </motion.h2>
              <motion.div variants={fadeInUp} className="divider-line mb-8" />
              <motion.p variants={fadeInUp} className="text-body mb-6">
                柔らかな「光」が差すプライベート空間で
                一人のスタッフが最初から最後まで丁寧にお客様と向き合い、
                大人の男性に相応しい凜とした「印象」と
                「光」のような清潔感をご提供致します。
              </motion.p>
              <motion.p variants={fadeInUp} className="text-body mb-10">
                日々忙しい大人の男性にカット、シェービング、ヘッドスパなど
                様々なメニューを通じ「上質な休息」をご提供します。
              </motion.p>
              <motion.div variants={fadeInUp}>
                <Link href="/about" className="btn-ghost group">
                  <span className="border-b border-text-muted pb-1 group-hover:border-accent transition-colors">
                    店舗情報を見る
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Menu Section */}
      <AnimatedSection className="py-16 md:py-32 section-dark overflow-hidden">
        <div className="container-wide relative z-10">
          <div className="text-center mb-20">
            <motion.p variants={fadeInUp} className="text-subheading mb-4">
              Menu
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-heading mb-6">
              メニュー
            </motion.h2>
            <motion.div variants={fadeInUp} className="divider-line-long mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {featuredMenus.map((menu) => (
              <motion.div
                key={menu.title}
                variants={fadeInUp}
                className="menu-card"
              >
                <div className="mb-4">
                <p className="text-xs tracking-[0.2em] text-accent-light uppercase mb-1">
                  {menu.title}
                </p>
                <h3 className="text-2xl font-serif">
                  {menu.titleJa}
                </h3>
              </div>
                <p className="text-body mb-4">
                  {menu.description}
                </p>
                <div className="flex justify-between items-center pt-4 border-t border-glass-border">
                  <span className="text-xl text-gold font-light">
                    {menu.price}
                  </span>
                  <span className="text-sm text-text-muted">
                    {menu.duration}
                  </span>
                </div>
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

      {/* News Section */}
      <AnimatedSection className="py-16 md:py-32 section-gradient overflow-hidden">
        <div className="container-narrow">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12">
            <div>
              <motion.p variants={fadeInUp} className="text-subheading mb-4">
                News
              </motion.p>
              <motion.h2 variants={fadeInUp} className="text-heading">
                お知らせ
              </motion.h2>
            </div>
            <motion.div variants={fadeIn} className="mt-6 md:mt-0">
              <Link href="/news" className="btn-ghost group">
                <span>一覧を見る</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          <motion.div variants={fadeInUp} className="divider-line-long mb-8" />

          <div className="space-y-0">
            {newsItems.map((news, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="news-card group cursor-pointer"
              >
                <Link href="/news" className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                  <span className="text-sm text-text-muted font-light tracking-wider">
                    {news.date}
                  </span>
                  <span className="text-text-secondary group-hover:text-white transition-colors">
                    {news.title}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Access Section */}
      <AnimatedSection className="py-16 md:py-32 section-dark overflow-hidden">
        <div className="container-wide relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <motion.p variants={fadeInUp} className="text-subheading mb-4">
                Access
              </motion.p>
              <motion.h2 variants={fadeInUp} className="text-heading mb-8">
                アクセス
              </motion.h2>
              <motion.div variants={fadeInUp} className="divider-line mb-10" />

              <motion.div variants={fadeInUp} className="space-y-8">
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-text-muted mb-2">Address</p>
                    <p className="text-lg text-text-secondary">
                      〒570-0036<br />
                      大阪府守口市八雲中町1-24-1
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-text-muted mb-2">Hours</p>
                    <div className="space-y-2">
                      <div className="text-text-secondary">
                        <div className="flex justify-between max-w-xs">
                          <span>平日</span>
                          <span>10:00 - 21:00</span>
                        </div>
                        <p className="text-xs text-text-muted mt-1">（受付20:00まで）</p>
                      </div>
                      <div className="text-text-secondary">
                        <div className="flex justify-between max-w-xs">
                          <span>土日祝</span>
                          <span>10:00 - 20:30</span>
                        </div>
                        <p className="text-xs text-text-muted mt-1">（受付19:30まで）</p>
                      </div>
                      <p className="text-sm text-text-muted mt-2">定休日: 毎週月曜日（不定休あり）</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Calendar className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-text-muted mb-2">Reservation</p>
                    <p className="text-text-secondary">完全予約制</p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-12">
                <Link
                  href="/about"
                  className="btn-outline"
                >
                  店舗情報を見る
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>

            {/* Google Maps Embed */}
            <motion.div variants={fadeInUp} className="relative w-full aspect-square lg:aspect-[4/3] glass-card overflow-hidden">
              <iframe
                src="https://maps.google.com/maps?q=%E5%A4%A7%E9%98%AA%E5%BA%9C%E5%AE%88%E5%8F%A3%E5%B8%82%E5%85%AB%E9%9B%B2%E4%B8%AD%E7%94%BA1-24-1&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="MONË 店舗所在地"
                className="absolute inset-0 grayscale-[30%] contrast-[1.1]"
              />
              <div className="absolute bottom-4 right-4">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=men's+hair+MONE+大阪府守口市八雲中町1-24-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-dark/90 border border-glass-border text-white text-sm transition-all duration-300 hover:bg-accent hover:border-accent backdrop-blur-sm"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs tracking-[0.1em]">大きな地図で見る</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="py-16 md:py-32 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-dark-gray via-dark to-dark-gray" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent opacity-[0.02] blur-[150px]" />
        </div>

        <div className="container-narrow relative z-10 text-center">
          <motion.p variants={fadeInUp} className="text-subheading mb-4">
            Reservation
          </motion.p>
          <motion.h2 variants={fadeInUp} className="text-heading mb-6">
            ご予約をお待ちしております
          </motion.h2>
          <motion.div variants={fadeInUp} className="divider-line mx-auto mb-8" />
          <motion.p variants={fadeInUp} className="text-body max-w-lg mx-auto mb-12">
            当サロンは完全予約制となっております。<br />
            お電話またはWebからご予約ください。
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking" className="btn-primary">
              Web予約する
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="tel:06-6908-4859" className="btn-outline">
              06-6908-4859
            </a>
          </motion.div>
        </div>
      </AnimatedSection>

    </div>
  );
}
