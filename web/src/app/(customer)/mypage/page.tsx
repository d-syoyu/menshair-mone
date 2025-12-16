'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Calendar, User, LogOut, ArrowRight, Clock, Scissors } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface Reservation {
  id: string;
  menuSummary: string;
  totalPrice: number;
  date: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function MyPage() {
  const { data: session } = useSession();
  const [upcomingReservations, setUpcomingReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await fetch('/api/reservations?status=CONFIRMED&limit=50');
        const data = await res.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming =
          data.reservations?.filter((r: Reservation) => {
            const reservationDate = new Date(r.date);
            reservationDate.setHours(0, 0, 0, 0);
            return reservationDate >= today;
          }) || [];

        setUpcomingReservations(upcoming.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch reservations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}（${WEEKDAYS[date.getDay()]}）`;
  };

  return (
    <div className="min-h-screen bg-dark pt-32 pb-20">
      <div className="container-wide max-w-2xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <p className="text-subheading mb-2">My Page</p>
          <h1 className="text-heading mb-4 text-white">マイページ</h1>
          <div className="divider-line mx-auto" />
        </motion.div>

        {/* User Info */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="glass-card p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-medium text-lg text-white">
                {session?.user?.name || 'ゲスト'}
              </p>
              <p className="text-sm text-text-muted">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        >
          <Link
            href="/booking"
            className="flex items-center gap-4 p-6 bg-accent text-white rounded hover:bg-accent-light transition-colors"
          >
            <Calendar className="w-6 h-6" />
            <div className="flex-1">
              <p className="font-medium">新規予約</p>
              <p className="text-sm opacity-70">空き状況を確認</p>
            </div>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/mypage/reservations"
            className="flex items-center gap-4 p-6 glass-card hover:border-accent transition-colors"
          >
            <Clock className="w-6 h-6 text-accent-light" />
            <div className="flex-1">
              <p className="font-medium text-white">予約履歴</p>
              <p className="text-sm text-text-muted">
                過去・今後の予約を確認
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-text-muted" />
          </Link>
        </motion.div>

        {/* Upcoming Reservations */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="glass-card p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-white">直近の予約</h2>
            <Link
              href="/mypage/reservations"
              className="text-sm text-accent-light hover:text-accent transition-colors"
            >
              すべて見る
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-text-muted">
              読み込み中...
            </div>
          ) : upcomingReservations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted mb-4">
                予約はまだありません
              </p>
              <Link
                href="/booking"
                className="btn-primary"
              >
                予約する
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingReservations.map((reservation) => (
                <Link
                  key={reservation.id}
                  href={`/mypage/reservations?id=${reservation.id}`}
                  className="flex items-center gap-4 p-4 bg-dark-gray/50 rounded hover:bg-dark-gray transition-colors"
                >
                  <div className="w-12 h-12 bg-dark rounded flex items-center justify-center border border-glass-border">
                    <Scissors className="w-5 h-5 text-accent-light" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {reservation.menuSummary || 'メニュー未設定'}
                    </p>
                    <p className="text-sm text-text-muted">
                      {formatDate(reservation.date)} {reservation.startTime}〜
                    </p>
                    <p className="text-sm text-gold">
                      ¥{reservation.totalPrice.toLocaleString()}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-text-muted" />
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center"
        >
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 text-text-muted hover:text-red-400 border border-transparent hover:border-red-400/30 hover:bg-red-400/10 rounded transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </motion.div>
      </div>
    </div>
  );
}
