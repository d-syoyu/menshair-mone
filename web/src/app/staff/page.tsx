'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView, type Variants } from 'framer-motion';
import { ArrowRight, Instagram } from 'lucide-react';

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

const staffMembers = [
  {
    id: 1,
    name: '大木 美奈',
    nameEn: 'Mina Oki',
    role: 'Owner / Stylist',
    image: '/white_staff.png',
    career: '5年',
    specialties: ['縮毛矯正', 'カット', 'カラー'],
    message: '髪のお悩みに寄り添い、ライフスタイルに合った最適なスタイルをご提案いたします。特に縮毛矯正を得意としておりますので、くせ毛でお悩みの方はぜひご相談ください。',
    instagram: ''
  }
];

export default function StaffPage() {
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
          <p className="text-subheading mb-4">Our Team</p>
          <h1 className="text-display mb-6">Staff</h1>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-[var(--color-warm-gray)] max-w-lg mx-auto">
            経験豊富なスタイリストが<br />
            あなたの「なりたい」を叶えます
          </p>
        </motion.div>
      </section>

      {/* Staff List */}
      <AnimatedSection className="pb-32">
        <div className="container-wide">
          <div className="space-y-32">
            {staffMembers.map((staff, index) => (
              <motion.div
                key={staff.id}
                variants={fadeInUp}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                  index % 2 === 1 ? '' : ''
                }`}
              >
                {/* Image */}
                <div className={`relative ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={staff.image}
                      alt={staff.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* Decorative element */}
                  <div className={`absolute w-32 h-32 bg-[var(--color-sage)] opacity-20 -z-10 ${
                    index % 2 === 0 ? '-bottom-6 -right-6' : '-bottom-6 -left-6'
                  }`} />
                </div>

                {/* Content */}
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <p className="text-xs tracking-[0.3em] text-[var(--color-sage)] uppercase mb-2">
                    {staff.role}
                  </p>
                  <h2 className="text-4xl font-[family-name:var(--font-serif)] mb-1">
                    {staff.name}
                  </h2>
                  <p className="text-sm text-[var(--color-warm-gray)] mb-6">
                    {staff.nameEn}
                  </p>
                  <div className="divider-line mb-8" />

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                      <p className="text-xs tracking-[0.2em] text-[var(--color-warm-gray)] uppercase mb-2">
                        Career
                      </p>
                      <p className="text-[var(--color-charcoal)]">{staff.career}</p>
                    </div>
                    <div>
                      <p className="text-xs tracking-[0.2em] text-[var(--color-warm-gray)] uppercase mb-2">
                        Specialties
                      </p>
                      <p className="text-[var(--color-charcoal)]">
                        {staff.specialties.join(' / ')}
                      </p>
                    </div>
                  </div>

                  <p className="text-[var(--color-warm-gray)] leading-relaxed mb-8">
                    {staff.message}
                  </p>

                  <a
                    href={`https://instagram.com/${staff.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[var(--color-charcoal)] hover:text-[var(--color-sage)] transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                    <span className="text-sm">{staff.instagram}</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Recruitment */}
      <section className="py-32 bg-[var(--color-cream-dark)]">
        <div className="container-narrow text-center">
          <p className="text-subheading mb-4">We are hiring</p>
          <h2 className="text-heading mb-6">スタッフ募集</h2>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-[var(--color-warm-gray)] max-w-lg mx-auto mb-10">
            私たちと一緒に働きませんか？<br />
            経験者・未経験者問わず、やる気のある方を募集しています。
          </p>
          <Link href="/booking" className="btn-outline">
            ご予約はこちら
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-[var(--color-charcoal)] text-white">
        <div className="container-narrow text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[var(--color-sage-light)] mb-4">
            Reservation
          </p>
          <h2 className="text-heading text-white mb-6">
            ご予約をお待ちしております
          </h2>
          <div className="w-16 h-[1px] bg-[var(--color-gold)] mx-auto mb-8" />
          <p className="text-gray-400 mb-10">
            指名料は無料です。<br />
            お気軽にご希望のスタイリストをお伝えください。
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[var(--color-charcoal)] text-sm tracking-[0.2em] uppercase transition-all duration-500 hover:bg-[var(--color-sage)] hover:text-white"
          >
            ご予約はこちら
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
