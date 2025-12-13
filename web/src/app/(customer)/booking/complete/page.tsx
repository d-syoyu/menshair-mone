'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, ArrowRight } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

function BookingCompleteContent() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('id');

  return (
    <div className="min-h-screen bg-dark pt-32 pb-20">
      <div className="container-narrow max-w-lg mx-auto text-center px-4">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle className="w-10 h-10 text-white" />
        </motion.div>

        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-12"
        >
          <h1 className="text-heading text-white mb-4">ご予約完了</h1>
          <div className="divider-line mx-auto mb-6" />
          <p className="text-text-secondary">
            ご予約ありがとうございます。<br />
            ご来店を心よりお待ちしております。
          </p>
        </motion.div>

        {/* Reservation ID */}
        {reservationId && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="bg-dark-lighter border border-glass-border rounded p-6 mb-8"
          >
            <p className="text-xs tracking-wider text-text-muted uppercase mb-2">
              予約番号
            </p>
            <p className="font-mono text-lg text-white">{reservationId}</p>
          </motion.div>
        )}

        {/* Info */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-glass-light p-6 rounded mb-8 text-left border border-glass-border"
        >
          <h2 className="font-medium mb-4 text-white">ご確認ください</h2>
          <ul className="space-y-3 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              予約内容はマイページからご確認いただけます。
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              キャンセルは前日19:00までマイページから可能です。
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              ご不明な点がございましたらお電話でお問い合わせください。
            </li>
          </ul>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="space-y-4"
        >
          <Link
            href="/mypage/reservations"
            className="flex items-center justify-center gap-2 w-full py-4 bg-accent text-white text-sm tracking-wider uppercase hover:bg-accent-light transition-colors rounded"
          >
            <Calendar className="w-4 h-4" />
            予約を確認する
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-4 border border-glass-border text-white text-sm tracking-wider hover:bg-glass-light transition-colors rounded"
          >
            トップページへ
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default function BookingCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dark pt-32 pb-20">
          <div className="container-narrow text-center">
            <p className="text-text-muted">読み込み中...</p>
          </div>
        </div>
      }
    >
      <BookingCompleteContent />
    </Suspense>
  );
}
