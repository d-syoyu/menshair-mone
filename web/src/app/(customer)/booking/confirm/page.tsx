'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, Scissors, ArrowLeft, Check } from 'lucide-react';
import { SALON_INFO } from '@/constants/salon';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// DBから取得するメニューの型
interface DbMenu {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  priceVariable: boolean; // 価格変動あり
  duration: number;
  lastBookingTime: string;
  displayOrder: number;
  category: {
    id: string;
    name: string;
    nameEn: string;
    color: string;
    displayOrder: number;
  };
}

// カテゴリの文字色を取得
const getCategoryTextColor = (categoryName: string): string => {
  const textColors: Record<string, string> = {
    "カット": "#FFFFFF",
    "カラー": "#FFFFFF",
    "パーマ": "#1F2937",
    "縮毛矯正": "#1F2937",
    "スパ・トリートメント": "#FFFFFF",
    "シャンプー＆セット": "#1F2937",
    "メンズシェービング": "#1F2937",
  };
  return textColors[categoryName] || "#FFFFFF";
};

function BookingConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  // DBから取得したメニュー
  const [allMenus, setAllMenus] = useState<DbMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // URLパラメータから取得
  const menuIdsParam = searchParams.get('menuIds');
  const dateStr = searchParams.get('date');
  const time = searchParams.get('time');
  const menuIds = menuIdsParam ? menuIdsParam.split(',').filter(Boolean) : [];
  const date = dateStr ? new Date(dateStr) : null;

  // メニューをAPIから取得
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch('/api/menus');
        const data = await res.json();
        setAllMenus(data.menus || []);
      } catch (error) {
        console.error('Failed to fetch menus:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenus();
  }, []);

  // 選択されたメニューを取得
  const selectedMenus = menuIds
    .map(id => allMenus.find(m => m.id === id))
    .filter((m): m is DbMenu => m !== undefined);

  // 合計計算
  const totals = selectedMenus.length > 0 ? {
    totalPrice: selectedMenus.reduce((sum, m) => sum + m.price, 0),
    totalDuration: selectedMenus.reduce((sum, m) => sum + m.duration, 0),
    menuSummary: selectedMenus.map(m => m.name).join(' + '),
    earliestLastBookingTime: selectedMenus.reduce((earliest, m) => {
      return m.lastBookingTime < earliest ? m.lastBookingTime : earliest;
    }, '20:00'),
  } : null;

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark pt-32 pb-20">
        <div className="container-narrow text-center">
          <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-text-muted">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (selectedMenus.length === 0 || !date || !time || !totals) {
    return (
      <div className="min-h-screen bg-dark pt-32 pb-20">
        <div className="container-narrow text-center">
          <p className="text-text-muted mb-8">
            予約情報が見つかりません
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 text-accent hover:text-accent-light"
          >
            <ArrowLeft className="w-4 h-4" />
            予約ページに戻る
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuIds,
          date: dateStr,
          startTime: time,
          note: note || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '予約の作成に失敗しました');
        setIsSubmitting(false);
        return;
      }

      // 成功時は完了ページへ
      router.push(`/booking/complete?id=${data.reservation.id}`);
    } catch {
      setError('予約の作成に失敗しました');
      setIsSubmitting(false);
    }
  };

  // 終了時刻を計算
  const [hours, minutes] = time.split(':').map(Number);
  const endMinutes = hours * 60 + minutes + totals.totalDuration;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-dark pt-32 pb-20">
      <div className="container-narrow max-w-lg mx-auto px-4">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <p className="text-subheading mb-2">Confirmation</p>
          <h1 className="text-heading text-white mb-4">予約内容の確認</h1>
          <div className="divider-line mx-auto" />
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[
            { num: 1, label: 'メニュー' },
            { num: 2, label: '日時' },
            { num: 3, label: '確認' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  s.num <= 3
                    ? 'bg-accent text-white'
                    : 'bg-glass-light text-text-muted'
                }`}
              >
                {s.num < 3 ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className="ml-2 text-sm hidden sm:inline text-text-secondary">{s.label}</span>
              {i < 2 && (
                <div className="w-12 sm:w-20 h-[1px] bg-accent ml-4" />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Reservation Details */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-dark-lighter border border-glass-border rounded p-6 mb-6"
        >
          <h2 className="text-lg font-medium mb-6 text-white">ご予約内容</h2>

          <div className="space-y-4">
            {/* Menus */}
            <div className="flex items-start gap-4 py-4 border-b border-glass-border">
              <Scissors className="w-5 h-5 text-accent mt-0.5" />
              <div className="flex-1">
                <p className="text-xs tracking-wider text-text-muted uppercase mb-3">
                  メニュー
                </p>
                <div className="space-y-3">
                  {selectedMenus.map((menu, index) => (
                    <div key={menu.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                          style={{
                            backgroundColor: menu.category.color || '#888',
                            color: getCategoryTextColor(menu.category.name)
                          }}
                        >
                          {index + 1}
                        </span>
                        <span className="font-medium text-white">{menu.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gold">
                          ¥{menu.price.toLocaleString()}{menu.priceVariable ? '〜' : ''}
                        </span>
                        <span className="text-sm text-text-muted ml-2">
                          ({menu.duration}分)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* 合計 */}
                <div className="mt-4 pt-3 border-t border-dashed border-glass-border flex justify-between items-center">
                  <span className="font-medium text-white">合計</span>
                  <div>
                    <span className="text-gold text-lg font-medium">
                      ¥{totals.totalPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-text-muted ml-2">
                      (約{totals.totalDuration}分)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-4 py-4 border-b border-glass-border">
              <Calendar className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <p className="text-xs tracking-wider text-text-muted uppercase mb-1">
                  ご予約日
                </p>
                <p className="font-medium text-white">
                  {date.getFullYear()}年{date.getMonth() + 1}月{date.getDate()}日（
                  {WEEKDAYS[date.getDay()]}）
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-4 py-4">
              <Clock className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <p className="text-xs tracking-wider text-text-muted uppercase mb-1">
                  ご予約時間
                </p>
                <p className="font-medium text-white">
                  {time} 〜 {endTime}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Note */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-dark-lighter border border-glass-border rounded p-6 mb-6"
        >
          <label
            htmlFor="note"
            className="block text-xs tracking-wider text-text-muted uppercase mb-2"
          >
            ご要望・備考（任意）
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="施術に関するご要望などがあればご記入ください"
            rows={3}
            maxLength={500}
            className="w-full p-3 border border-glass-border rounded bg-glass-light text-white placeholder-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
          />
          <p className="text-xs text-text-muted mt-1 text-right">
            {note.length}/500
          </p>
        </motion.div>

        {/* Salon Info */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-glass-light p-6 rounded mb-8 border border-glass-border"
        >
          <p className="text-sm text-text-muted mb-2">
            ご予約店舗
          </p>
          <p className="font-medium mb-1 text-white">{SALON_INFO.name}</p>
          <p className="text-sm text-text-secondary">
            {SALON_INFO.address}
          </p>
          <p className="text-sm text-text-secondary">
            TEL: {SALON_INFO.phone}
          </p>
        </motion.div>

        {/* Cancellation Policy */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-sm text-text-muted mb-8"
        >
          <p className="mb-2">【キャンセルポリシー】</p>
          <p>
            キャンセルはご予約前日の19:00まで可能です。
            それ以降のキャンセルはお電話にてお問い合わせください。
          </p>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/booking`}
            className="flex-1 py-4 text-center text-sm tracking-wider border border-glass-border text-white hover:bg-glass-light transition-colors rounded"
          >
            戻る
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-4 text-sm tracking-wider bg-accent text-white hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
          >
            {isSubmitting ? '予約中...' : 'この内容で予約する'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmPage() {
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
      <BookingConfirmContent />
    </Suspense>
  );
}
