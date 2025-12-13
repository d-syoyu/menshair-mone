'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  XCircle,
  LogOut,
  Scissors,
  AlertTriangle,
  X,
  Users,
  Menu,
} from 'lucide-react';
import { CATEGORY_COLORS } from '@/constants/menu';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface ReservationItem {
  id: string;
  menuId: string;
  menuName: string;
  category: string;
  price: number;
  duration: number;
  orderIndex: number;
}

interface Reservation {
  id: string;
  totalPrice: number;
  totalDuration: number;
  menuSummary: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  items: ReservationItem[];
}

interface Stats {
  todayCount: number;
  weekCount: number;
  totalReservations: number;
  weekStartStr: string;
  weekEndStr: string;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// 時間を分に変換
const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

interface ConfirmDialog {
  isOpen: boolean;
  reservationId: string;
  reservationName: string;
  customerName: string;
  action: 'CANCELLED' | 'NO_SHOW' | 'CONFIRMED';
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    reservationId: '',
    reservationName: '',
    customerName: '',
    action: 'CANCELLED',
  });

  // 認証チェック - 未ログインまたは管理者でない場合はリダイレクト
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/admin/login');
      return;
    }
    if (session?.user?.role !== 'ADMIN') {
      router.replace('/admin/login');
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== 'authenticated' || session?.user?.role !== 'ADMIN') return;

    const fetchData = async () => {
      try {
        // 今日の予約を取得
        const res = await fetch('/api/reservations?limit=50');
        const data = await res.json();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayRes = data.reservations?.filter((r: Reservation) => {
          const date = new Date(r.date);
          return date >= today && date < tomorrow && r.status === 'CONFIRMED';
        }) || [];

        // 時間順にソート
        todayRes.sort((a: Reservation, b: Reservation) =>
          a.startTime.localeCompare(b.startTime)
        );

        setTodayReservations(todayRes);

        // 統計情報を計算（月曜始まり）
        const weekStart = new Date(today);
        const dayOfWeek = today.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
        weekStart.setDate(weekStart.getDate() + daysToMonday);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekReservations = data.reservations?.filter((r: Reservation) => {
          const date = new Date(r.date);
          return date >= weekStart && date < weekEnd && r.status !== 'CANCELLED';
        }) || [];

        const weekEndDate = new Date(weekEnd);
        weekEndDate.setDate(weekEndDate.getDate() - 1);

        const totalReservations = data.reservations?.filter(
          (r: Reservation) => r.status !== 'CANCELLED'
        ).length || 0;

        setStats({
          todayCount: todayRes.length,
          weekCount: weekReservations.length,
          totalReservations,
          weekStartStr: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          weekEndStr: `${weekEndDate.getMonth() + 1}/${weekEndDate.getDate()}`,
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status, session]);

  const openConfirmDialog = (
    reservation: Reservation,
    action: 'CANCELLED' | 'NO_SHOW' | 'CONFIRMED'
  ) => {
    setConfirmDialog({
      isOpen: true,
      reservationId: reservation.id,
      reservationName: reservation.menuSummary,
      customerName: reservation.user.name || '名前未登録',
      action,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleStatusChange = async () => {
    const { reservationId, action } = confirmDialog;
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });

      if (res.ok) {
        setTodayReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId ? { ...r, status: action } : r
          )
        );
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      closeConfirmDialog();
    }
  };

  const today = new Date();

  // 各メニューアイテムのセグメント位置を計算
  const calculateSegments = (reservation: Reservation) => {
    const startMin = timeToMinutes(reservation.startTime) - 600;
    const totalMin = 600;
    let currentOffset = 0;

    return reservation.items.map((item) => {
      const left = ((startMin + currentOffset) / totalMin) * 100;
      const width = (item.duration / totalMin) * 100;
      currentOffset += item.duration;
      return { ...item, left, width };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
      <div className="container-wide">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-medium">管理画面</h1>
            <p className="text-base md:text-lg text-gray-500">
              {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日（
              {WEEKDAYS[today.getDay()]}）
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">{session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 px-4 py-3 text-base text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              ログアウト
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8"
        >
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-6 h-6 md:w-7 md:h-7 text-[var(--color-accent)]" />
              <span className="text-base md:text-lg text-gray-500">本日の予約</span>
            </div>
            <p className="text-4xl md:text-5xl font-light">{stats?.todayCount ?? '-'}</p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-6 h-6 md:w-7 md:h-7 text-blue-500" />
              <span className="text-base md:text-lg text-gray-500">
                今週の予約
                {stats && (
                  <span className="text-sm text-gray-400 ml-1">
                    （{stats.weekStartStr}~{stats.weekEndStr}）
                  </span>
                )}
              </span>
            </div>
            <p className="text-4xl md:text-5xl font-light">{stats?.weekCount ?? '-'}</p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Scissors className="w-6 h-6 md:w-7 md:h-7 text-[var(--color-gold)]" />
              <span className="text-base md:text-lg text-gray-500">Webからの予約数</span>
            </div>
            <p className="text-4xl md:text-5xl font-light">{stats?.totalReservations ?? '-'}</p>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <Link
            href="/admin/reservations"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-[var(--color-accent)]/10 rounded-lg">
              <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="font-medium text-sm">予約管理</p>
              <p className="text-xs text-gray-500">予約一覧・編集</p>
            </div>
          </Link>

          <Link
            href="/admin/menus"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-[var(--color-gold)]/10 rounded-lg">
              <Menu className="w-5 h-5 text-[var(--color-gold)]" />
            </div>
            <div>
              <p className="font-medium text-sm">メニュー管理</p>
              <p className="text-xs text-gray-500">メニュー・カテゴリ</p>
            </div>
          </Link>

          <Link
            href="/admin/customers"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-sm">顧客管理</p>
              <p className="text-xs text-gray-500">顧客情報</p>
            </div>
          </Link>
        </motion.div>

        {/* Today's Reservations - Timeline View */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white rounded-xl shadow-sm"
        >
          <div className="p-6 md:p-8 border-b border-gray-100">
            <h2 className="text-lg md:text-xl font-medium">本日のご予約</h2>
          </div>

          {isLoading ? (
            <div className="p-12 md:p-16 text-center text-lg text-gray-500">読み込み中...</div>
          ) : todayReservations.length === 0 ? (
            <div className="p-12 md:p-16 text-center text-lg text-gray-500">
              本日の予約はありません
            </div>
          ) : (
            <>
              {/* Mobile List View */}
              <div className="md:hidden divide-y divide-gray-100">
                {todayReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="p-4 flex items-center gap-3"
                  >
                    {/* Time */}
                    <div className="flex-shrink-0 text-center w-16">
                      <p className="text-base font-medium">{reservation.startTime}</p>
                      <p className="text-xs text-gray-400">~{reservation.endTime}</p>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      {/* カラーセグメント */}
                      <div className="flex gap-0.5 mb-1">
                        {reservation.items.map((item) => (
                          <div
                            key={item.id}
                            className="h-1.5 rounded-full"
                            style={{
                              backgroundColor: CATEGORY_COLORS[item.category] || '#888',
                              flex: item.duration,
                            }}
                            title={item.menuName}
                          />
                        ))}
                      </div>
                      <p className="font-medium text-sm truncate">{reservation.menuSummary}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {reservation.user.name || '名前未登録'}
                      </p>
                      <p className="text-xs text-[var(--color-gold)]">
                        ¥{reservation.totalPrice.toLocaleString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {reservation.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => openConfirmDialog(reservation, 'CANCELLED')}
                            className="p-2.5 text-gray-400 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="キャンセル"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openConfirmDialog(reservation, 'NO_SHOW')}
                            className="p-2.5 text-red-500 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="無断キャンセル"
                          >
                            <Clock className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {reservation.status === 'CANCELLED' && (
                        <button
                          onClick={() => openConfirmDialog(reservation, 'CONFIRMED')}
                          className="px-3 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors min-h-[44px]"
                        >
                          取消
                        </button>
                      )}
                      {reservation.status === 'NO_SHOW' && (
                        <button
                          onClick={() => openConfirmDialog(reservation, 'CONFIRMED')}
                          className="px-3 py-2 text-sm text-red-500 bg-red-50 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors min-h-[44px]"
                        >
                          無断
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tablet/Desktop Timeline View */}
              <div className="hidden md:block p-4 md:p-6">
                {/* Single Timeline */}
                <div className="mb-6 px-6 lg:px-8">
                  {/* Time labels */}
                  <div className="relative h-7 mb-2">
                    {Array.from({ length: 11 }, (_, i) => {
                      const left = (i / 10) * 100;
                      const translateClass = i === 0
                        ? 'translate-x-0'
                        : i === 10
                          ? '-translate-x-full'
                          : '-translate-x-1/2';
                      return (
                        <div
                          key={i}
                          className={`absolute text-xs md:text-sm text-gray-400 ${translateClass}`}
                          style={{ left: `${left}%` }}
                        >
                          {i + 10}:00
                        </div>
                      );
                    })}
                  </div>

                  {/* Timeline bar */}
                  <div className="relative h-14 md:h-16 lg:h-20 bg-gray-50 rounded-lg overflow-hidden">
                    {/* Grid lines - 20分刻み */}
                    <div className="absolute inset-0">
                      {Array.from({ length: 31 }, (_, i) => {
                        const isHourLine = i % 3 === 0;
                        const left = (i / 30) * 100;
                        return (
                          <div
                            key={i}
                            className={`absolute top-0 bottom-0 ${
                              isHourLine ? 'border-l border-gray-300' : 'border-l border-gray-200/60'
                            }`}
                            style={{ left: `${left}%` }}
                          />
                        );
                      })}
                    </div>

                    {/* Reservations with color segments */}
                    {todayReservations.map((reservation) => {
                      const startMin = timeToMinutes(reservation.startTime) - 600;
                      const endMin = timeToMinutes(reservation.endTime) - 600;
                      const totalMin = 600;
                      const left = (startMin / totalMin) * 100;
                      const width = ((endMin - startMin) / totalMin) * 100;
                      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                      const segments = calculateSegments(reservation);

                      return (
                        <button
                          key={reservation.id}
                          onClick={() => router.push(`/admin/reservations?date=${dateStr}&highlight=${reservation.id}`)}
                          className={`absolute top-1.5 bottom-1.5 md:top-2 md:bottom-2 rounded-md md:rounded-lg overflow-hidden
                            ${reservation.status === 'CANCELLED' ? 'opacity-30' : ''}
                            ${reservation.status === 'NO_SHOW' ? 'opacity-50' : ''}
                            shadow-sm hover:shadow-md transition-all flex cursor-pointer hover:scale-[1.02] active:scale-100`}
                          style={{
                            left: `${left}%`,
                            width: `${Math.max(width, 4)}%`,
                          }}
                          title={`${reservation.startTime}〜${reservation.endTime} ${reservation.menuSummary} - ${reservation.user.name || '名前未登録'}`}
                        >
                          {/* Color segments */}
                          {reservation.items.length > 0 ? (
                            reservation.items.map((item, idx) => {
                              const segmentWidth = (item.duration / reservation.totalDuration) * 100;
                              return (
                                <div
                                  key={item.id}
                                  className={`h-full flex items-center justify-center ${idx === 0 ? 'rounded-l-md md:rounded-l-lg' : ''} ${idx === reservation.items.length - 1 ? 'rounded-r-md md:rounded-r-lg' : ''}`}
                                  style={{
                                    backgroundColor: CATEGORY_COLORS[item.category] || '#888',
                                    width: `${segmentWidth}%`,
                                  }}
                                >
                                  {segmentWidth > 20 && (
                                    <span className="text-white text-xs font-medium truncate px-1">
                                      {item.menuName.split('（')[0]}
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-full w-full bg-[var(--color-accent)] flex items-center px-2">
                              <span className="text-white text-xs font-medium truncate">
                                {reservation.menuSummary}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reservation List */}
                <div className="divide-y divide-gray-100">
                  {todayReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="py-3 md:py-4 flex items-center gap-3 md:gap-4"
                    >
                      {/* Time */}
                      <div className="w-16 md:w-20 lg:w-24 flex-shrink-0">
                        <span className="text-base md:text-lg font-medium">{reservation.startTime}</span>
                        <span className="text-xs text-gray-400 ml-1">~{reservation.endTime}</span>
                      </div>

                      {/* Color indicator */}
                      <div className="flex gap-0.5 w-16 flex-shrink-0">
                        {reservation.items.map((item) => (
                          <div
                            key={item.id}
                            className="h-6 rounded"
                            style={{
                              backgroundColor: CATEGORY_COLORS[item.category] || '#888',
                              flex: item.duration,
                            }}
                            title={item.menuName}
                          />
                        ))}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm md:text-base truncate">{reservation.menuSummary}</p>
                        <p className="text-xs md:text-sm text-gray-500 truncate">
                          {reservation.user.name || '名前未登録'}
                          <span className="hidden lg:inline">
                            {reservation.user.phone && ` ・ ${reservation.user.phone}`}
                          </span>
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-sm md:text-base text-[var(--color-gold)] flex-shrink-0">
                        ¥{reservation.totalPrice.toLocaleString()}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                        {reservation.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => openConfirmDialog(reservation, 'CANCELLED')}
                              className="p-2 md:p-2.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                              title="キャンセル"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => openConfirmDialog(reservation, 'NO_SHOW')}
                              className="p-2 md:p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                              title="無断キャンセル"
                            >
                              <Clock className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {reservation.status === 'CANCELLED' && (
                          <button
                            onClick={() => openConfirmDialog(reservation, 'CONFIRMED')}
                            className="px-3 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors min-h-[40px]"
                          >
                            取消
                          </button>
                        )}
                        {reservation.status === 'NO_SHOW' && (
                          <button
                            onClick={() => openConfirmDialog(reservation, 'CONFIRMED')}
                            className="px-3 py-2 text-sm text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors min-h-[40px]"
                          >
                            無断
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* 確認ダイアログ */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeConfirmDialog}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <button
              onClick={closeConfirmDialog}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${
                confirmDialog.action === 'CONFIRMED'
                  ? 'bg-green-100 text-green-600'
                  : confirmDialog.action === 'CANCELLED'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-red-100 text-red-600'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium">
                {confirmDialog.action === 'CONFIRMED'
                  ? '予約を復元'
                  : confirmDialog.action === 'CANCELLED'
                    ? 'キャンセル確認'
                    : '無断キャンセル確認'}
              </h3>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-2">
                {confirmDialog.action === 'CONFIRMED'
                  ? '以下の予約を元に戻しますか？'
                  : `以下の予約を${confirmDialog.action === 'CANCELLED' ? 'キャンセル' : '無断キャンセル'}にしますか？`}
              </p>
              <p className="font-medium text-lg">{confirmDialog.reservationName}</p>
              <p className="text-gray-500">{confirmDialog.customerName} 様</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeConfirmDialog}
                className="flex-1 py-3 px-4 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[48px]"
              >
                戻る
              </button>
              <button
                onClick={handleStatusChange}
                className={`flex-1 py-3 px-4 text-white rounded-lg transition-colors min-h-[48px] ${
                  confirmDialog.action === 'CONFIRMED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : confirmDialog.action === 'CANCELLED'
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmDialog.action === 'CONFIRMED'
                  ? '予約を復元する'
                  : confirmDialog.action === 'CANCELLED'
                    ? 'キャンセルする'
                    : '無断キャンセルにする'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
