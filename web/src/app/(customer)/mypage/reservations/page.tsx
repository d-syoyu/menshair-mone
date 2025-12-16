'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Scissors, AlertCircle } from 'lucide-react';
import { canCancelReservation } from '@/constants/booking';

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
  note?: string;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: '予約確定', color: 'bg-accent/20 text-accent-light border border-accent/30' },
  CANCELLED: { label: 'キャンセル済', color: 'bg-dark-gray text-text-muted border border-glass-border' },
  COMPLETED: { label: '来店済み', color: 'bg-gold/20 text-gold border border-gold/30' },
  NO_SHOW: { label: '無断キャンセル', color: 'bg-red-500/20 text-red-400 border border-red-500/30' },
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await fetch('/api/reservations?limit=50');
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAYS[date.getDay()]}）`;
  };

  const handleCancelClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedReservation) return;

    setCancellingId(selectedReservation.id);
    try {
      const res = await fetch(`/api/reservations/${selectedReservation.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // 予約一覧を更新
        await fetchReservations();
      } else {
        const data = await res.json();
        alert(data.error || 'キャンセルに失敗しました');
      }
    } catch {
      alert('キャンセルに失敗しました');
    } finally {
      setCancellingId(null);
      setShowCancelModal(false);
      setSelectedReservation(null);
    }
  };

  const canCancel = (reservation: Reservation) => {
    if (reservation.status !== 'CONFIRMED') return false;
    return canCancelReservation(new Date(reservation.date));
  };

  // 今後の予約と過去の予約を分ける
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingReservations = reservations.filter(
    (r) => new Date(r.date) >= today && r.status === 'CONFIRMED'
  );
  const pastReservations = reservations.filter(
    (r) => new Date(r.date) < today || r.status !== 'CONFIRMED'
  );

  return (
    <div className="min-h-screen bg-dark pt-32 pb-20">
      <div className="container-wide max-w-2xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <Link
            href="/mypage"
            className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            マイページに戻る
          </Link>
          <div className="text-center">
            <p className="text-subheading mb-2">Reservations</p>
            <h1 className="text-heading mb-4">予約履歴</h1>
            <div className="divider-line mx-auto" />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12 text-text-muted">
            読み込み中...
          </div>
        ) : reservations.length === 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center py-12"
          >
            <p className="text-text-muted mb-6">
              予約履歴はありません
            </p>
            <Link
              href="/booking"
              className="btn-primary"
            >
              予約する
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Upcoming Reservations */}
            {upcomingReservations.length > 0 && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="mb-12"
              >
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5 text-accent-light" />
                  今後のご予約
                </h2>
                <div className="space-y-4">
                  {upcomingReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="glass-card p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Scissors className="w-5 h-5 text-accent-light" />
                          <div>
                            <p className="font-medium text-white">{reservation.menuSummary}</p>
                            <span
                              className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${STATUS_LABELS[reservation.status].color}`}
                            >
                              {STATUS_LABELS[reservation.status].label}
                            </span>
                          </div>
                        </div>
                        <p className="text-gold">
                          ¥{reservation.totalPrice.toLocaleString()}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Calendar className="w-4 h-4 text-text-muted" />
                          <span>{formatDate(reservation.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Clock className="w-4 h-4 text-text-muted" />
                          <span>
                            {reservation.startTime}〜{reservation.endTime}
                          </span>
                        </div>
                      </div>

                      {reservation.note && (
                        <p className="text-sm text-text-muted bg-dark-gray/50 p-3 rounded mb-4">
                          {reservation.note}
                        </p>
                      )}

                      {canCancel(reservation) && (
                        <button
                          onClick={() => handleCancelClick(reservation)}
                          disabled={cancellingId === reservation.id}
                          className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          {cancellingId === reservation.id
                            ? 'キャンセル中...'
                            : 'この予約をキャンセル'}
                        </button>
                      )}

                      {!canCancel(reservation) && reservation.status === 'CONFIRMED' && (
                        <p className="text-xs text-text-muted">
                          ※ キャンセル期限を過ぎています。お電話でお問い合わせください。
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Past Reservations */}
            {pastReservations.length > 0 && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
              >
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5 text-text-muted" />
                  過去のご予約
                </h2>
                <div className="space-y-4">
                  {pastReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="glass-card p-6 opacity-60"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Scissors className="w-5 h-5 text-text-muted" />
                          <div>
                            <p className="font-medium text-text-secondary">{reservation.menuSummary}</p>
                            <span
                              className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${STATUS_LABELS[reservation.status].color}`}
                            >
                              {STATUS_LABELS[reservation.status].label}
                            </span>
                          </div>
                        </div>
                        <p className="text-text-muted">
                          ¥{reservation.totalPrice.toLocaleString()}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-text-muted">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(reservation.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {reservation.startTime}〜{reservation.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-medium text-white">予約のキャンセル</h3>
            </div>

            <p className="text-text-muted mb-6">
              以下の予約をキャンセルしますか？
            </p>

            <div className="bg-dark-gray/50 p-4 rounded mb-6 border border-glass-border">
              <p className="font-medium text-white mb-1">{selectedReservation.menuSummary}</p>
              <p className="text-sm text-text-muted">
                {formatDate(selectedReservation.date)} {selectedReservation.startTime}〜
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 border border-glass-border text-sm tracking-wider text-text-secondary hover:bg-dark-gray hover:text-white transition-colors"
              >
                戻る
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancellingId !== null}
                className="flex-1 py-3 bg-red-500 text-white text-sm tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {cancellingId ? 'キャンセル中...' : 'キャンセルする'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
