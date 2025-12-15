'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, type Variants } from 'framer-motion';
import { ArrowRight, MapPin, Phone, Clock, Calendar, Sparkles, CreditCard } from 'lucide-react';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

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

interface PaymentMethod {
  code: string;
  displayName: string;
}

export default function AboutPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const res = await fetch('/api/payment-methods');
        const data = await res.json();
        setPaymentMethods(data.paymentMethods || []);
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
      }
    };
    fetchPaymentMethods();
  }, []);

  return (
    <div className="min-h-screen pt-32">
      {/* Hero */}
      <section className="container-wide pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="text-subheading mb-4">About</p>
          <h1 className="text-display mb-6">店舗情報</h1>
          <div className="divider-line mx-auto" />
        </motion.div>
      </section>

      {/* Concept Section */}
      <AnimatedSection className="py-12 section-dark">
        <div className="container-wide relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <motion.p variants={fadeInUp} className="text-subheading mb-4">
                Concept
              </motion.p>
              <motion.h2 variants={fadeInUp} className="text-heading mb-8">
                一人一人の男性に<br />
                <span className="text-gold">「光」</span>と<span style={{ color: '#3A7058' }}>「印象」</span>を…
              </motion.h2>
              <motion.div variants={fadeInUp} className="divider-line mx-auto mb-8" />
            </div>

            <motion.div variants={fadeInUp} className="text-body text-center space-y-6 mb-8">
              <p>
                柔らかな「光」が差すプライベート空間で<br />
                一人のスタッフが最初から最後まで丁寧にお客様と向き合い<br />
                大人の男性に相応しい凜とした「印象」と<br />
                「光」のような清潔感をご提供致します。
              </p>
              <p>
                日々忙しい大人の男性にカット、シェービング、ヘッドスパなど<br />
                様々なメニューを通じ「上質な休息」をご提供します。
              </p>
            </motion.div>

            {/* Entrance Image */}
            <motion.div variants={fadeInUp} className="mb-4 max-w-3xl mx-auto">
              <div className="relative aspect-[4/3] rounded overflow-hidden border border-glass-border">
                <Image
                  src="/entrance.jpeg"
                  alt="MONË 店舗入口"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px"
                  quality={90}
                />
              </div>
            </motion.div>

            {/* Name Origin */}
            <motion.div variants={fadeInUp} className="glass-card p-8 md:p-12 text-center">
              <p className="text-xs tracking-[0.2em] text-gold uppercase mb-4">Name Origin</p>
              <h3 className="text-2xl font-serif mb-6">サロン名の由来</h3>
              <p className="text-body">
                サロン名である「MONË」とは、<br />
                印象派の中で最も名が知られた光の画家、<br />
                クロード・モネから取りました。
              </p>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Featured Services */}
      <AnimatedSection className="py-12 section-gradient">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Head Spa */}
            <motion.div variants={fadeInUp} className="glass-card overflow-hidden">
              {/* Image */}
              <div className="relative aspect-[16/9]">
                <Image
                  src="/shampoo2.jpeg"
                  alt="ヘッドスパ"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-accent" />
                  <p className="text-xs tracking-[0.2em] text-accent-light uppercase">Head Spa</p>
                </div>
                <h3 className="text-2xl font-serif mb-6">手技のみでもみほぐす<br />男性のための本格ヘッドスパ</h3>
                <div className="text-body space-y-4">
                  <p>
                    日々の疲れでコリ固まった頭皮を
                    手でしか表現できない丁寧で深いもみほぐしを中心とした施術で柔らかくほぐし
                    血行を促進させ頭の軽さ・スッキリ感を体感いただき
                    毛髪の発育に欠かせない健康的な頭皮へと導きます。
                  </p>
                  <p>
                    人の手の温度と圧が生む<br />
                    『頭からの休息』をご提供させていただきます。
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Shaving */}
            <motion.div variants={fadeInUp} className="glass-card overflow-hidden">
              {/* Image */}
              <div className="relative aspect-[16/9]">
                <Image
                  src="/shaving.jpeg"
                  alt="シェービング"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-accent" />
                  <p className="text-xs tracking-[0.2em] text-accent-light uppercase">Shaving</p>
                </div>
                <h3 className="text-2xl font-serif mb-6">シェービングは、<br />最高のスキンケアである</h3>
                <div className="text-body space-y-4">
                  <p>
                    barberのみに許されたシェービング技術。<br />
                    髭を剃るのは勿論ですが、
                    産毛や古い角質を取り除き、血行を促進させ
                    肌本来の明るさ滑らかさを引き出します。
                  </p>
                  <p>
                    慌ただしい日常から少し離れ、<br />
                    barberだからこそできる最高のスキンケアのお時間をご堪能ください。
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Stylist Section */}
      <AnimatedSection className="py-12 section-dark">
        <div className="container-wide relative z-10">
          <div className="text-center mb-10">
            <motion.p variants={fadeInUp} className="text-subheading mb-4">
              Stylist
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-heading mb-6">
              スタイリスト紹介
            </motion.h2>
            <motion.div variants={fadeInUp} className="divider-line mx-auto" />
          </div>

          <div className="max-w-2xl mx-auto">
            <motion.div variants={fadeInUp} className="glass-card p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Stylist Photo */}
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-full flex-shrink-0 border border-glass-border overflow-hidden relative">
                  <Image
                    src="/staff.png"
                    alt="原崎 裕二 - MONË オーナー/スタイリスト"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 384px, 448px"
                    quality={100}
                    priority
                    unoptimized={false}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <p className="text-xs tracking-[0.2em] text-accent-light uppercase mb-2">Owner / Stylist</p>
                  <h3 className="text-3xl font-serif mb-2">原崎 裕二</h3>
                  <p className="text-text-muted text-sm mb-6">Harasaki Yuji</p>

                  <div className="divider-line mb-6 mx-auto md:mx-0" />

                  <div className="text-body space-y-4">
                    <p>
                      理容師歴14年。
                    </p>
                    <p>
                      ベリーショート～ショートスタイルは特に自信あり。<br />
                      目を引くスタイルならおまかせください！
                    </p>
                    <p>
                      お客様それぞれがお持ちの「悩み」お尋ねいただけると幸いです。<br />
                      全力で期待に応えさせていただきます！
                    </p>
                    <div className="pt-2">
                      <p className="text-sm text-text-muted">趣味：バスフィッシング（琵琶湖）</p>
                      <p className="text-sm text-text-muted ml-12">海釣り、野球、料理</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Access Section */}
      <AnimatedSection className="py-12 section-gradient">
        <div className="container-wide">
          <div className="text-center mb-10">
            <motion.p variants={fadeInUp} className="text-subheading mb-4">
              Access
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-heading mb-6">
              アクセス
            </motion.h2>
            <motion.div variants={fadeInUp} className="divider-line mx-auto" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Info */}
            <motion.div variants={fadeInUp} className="space-y-6">
              <div>
                <h3 className="text-2xl font-serif mb-6">MONË</h3>
                <p className="text-xs tracking-[0.2em] text-text-muted uppercase mb-2">
                  Men&apos;s Hair Salon
                </p>
              </div>

              <div className="space-y-5">
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
                  <Phone className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-text-muted mb-2">Tel</p>
                    <a href="tel:06-6908-4859" className="text-lg text-text-secondary hover:text-white transition-colors">
                      06-6908-4859
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-text-muted mb-2">Hours</p>
                    <div className="text-text-secondary space-y-2">
                      <div>
                        <p className="text-lg">平日 10:00 - 21:00</p>
                        <p className="text-xs text-text-muted">（受付20:00まで）</p>
                      </div>
                      <div>
                        <p className="text-lg">土日祝 10:00 - 20:30</p>
                        <p className="text-xs text-text-muted">（受付19:30まで）</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Calendar className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-text-muted mb-2">Closed</p>
                    <p className="text-lg text-text-secondary">毎週月曜日（不定休あり）</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <p className="text-body">
                  谷町線 守口駅から徒歩8分<br />
                  ※ 完全予約制となっております<br />
                  ※ 駐車場あり（1台）
                </p>

                {/* 支払方法 */}
                {paymentMethods.length > 0 && (
                  <div className="flex items-start gap-4">
                    <CreditCard className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-text-muted mb-2">Payment</p>
                      <p className="text-text-secondary">
                        {paymentMethods.map(pm => pm.displayName).join(' / ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Google Maps Embed */}
            <motion.div variants={fadeInUp} className="w-full">
              <div className="w-full aspect-square lg:aspect-[4/3] glass-card overflow-hidden relative">
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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-dark/90 border border-glass-border text-white text-sm transition-all duration-300 hover:bg-accent hover:border-accent backdrop-blur-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    大きな地図で見る
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* CTA */}
      <section className="py-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-dark via-dark-gray to-dark" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent opacity-[0.02] blur-[120px]" />
        </div>

        <div className="container-narrow text-center relative z-10">
          <p className="text-subheading mb-4">Reservation</p>
          <h2 className="text-heading mb-6">ご予約</h2>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-body max-w-lg mx-auto mb-10">
            ご予約・ご質問はお電話または<br />
            Instagram DMよりお気軽にご連絡ください。
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
    </div>
  );
}
