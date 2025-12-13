'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  XCircle,
  Clock,
  AlertTriangle,
  X,
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
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  note?: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  items: ReservationItem[];
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const STATUS_OPTIONS = [
  { value: '', label: 'すべて' },
  { value: 'CONFIRMED', label: '予約確定' },
  { value: 'CANCELLED', label: 'キャンセル' },
  { value: 'NO_SHOW', label: '無断キャンセル' },
];

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  NO_SHOW: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: '予約確定',
  COMPLETED: '来店済み',
  CANCELLED: 'キャンセル',
  NO_SHOW: '無断キャンセル',
};

// 今日の日付を取得（時刻を0時にリセット）
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

interface ConfirmDialog {
  isOpen: boolean;
  reservationId: string;
  reservationName: string;
  customerName: string;
  action: 'CANCELLED' | 'NO_SHOW' | 'CONFIRMED';
}

function AdminReservationsContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const highlightId = searchParams.get('highlight');

  // URLパラメータから初期日付を取得
  const getInitialDate = () => {
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        parsed.setHours(0, 0, 0, 0);
        return parsed;
      }
    }
    return getToday();
  };

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const initial = getInitialDate();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(getInitialDate);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    reservationId: '',
    reservationName: '',
    customerName: '',
    action: 'CANCELLED',
  });

  useEffect(() => {
    fetchReservations();
  }, [statusFilter, page]);

  // ハイライトされた予約までスクロール
  useEffect(() => {
    if (highlightId && !isLoading) {
      const element = document.getElementById(`reservation-${highlightId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [highlightId, isLoading]);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      let url = `/api/reservations?limit=20&page=${page}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setReservations(data.reservations || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 確認ダイアログを開く
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

  // 確認ダイアログを閉じる
  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  // ステータス変更を実行
  const handleStatusChange = async () => {
    const { reservationId, action } = confirmDialog;
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });

      if (res.ok) {
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId
              ? { ...r, status: action as Reservation['status'] }
              : r
          )
        );
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      closeConfirmDialog();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}（${WEEKDAYS[date.getDay()]}）`;
  };

  const filteredReservations = reservations.filter((r) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = r.user.name?.toLowerCase().includes(query);
      const matchesEmail = r.user.email?.toLowerCase().includes(query);
      const matchesMenu = r.menuSummary.toLowerCase().includes(query);
      if (!matchesName && !matchesEmail && !matchesMenu) {
        return false;
      }
    }
    if (selectedDate) {
      const resDate = new Date(r.date);
      if (resDate.toDateString() !== selectedDate.toDateString()) {
        return false;
      }
    }
    return true;
  });

  // カレンダー生成
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: (Date | null)[] = [];
    const current = new Date(startDate);

    while (current <= lastDay || current.getDay() !== 0) {
      if (current.getMonth() === month) {
        days.push(new Date(current));
      } else if (current < firstDay) {
        days.push(null);
      } else {
        break;
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // その日の予約数を取得
  const getReservationCount = (date: Date) => {
    return reservations.filter((r) => {
      const resDate = new Date(r.date);
      return (
        resDate.toDateString() === date.toDateString() &&
        r.status === 'CONFIRMED'
      );
    }).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
      <div className="container-wide">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-6 md:mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-3 text-base text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-4 min-h-[48px]"
          >
            <ArrowLeft className="w-5 h-5" />
            ダッシュボードに戻る
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-2xl md:text-3xl font-medium">予約管理</h1>
            {selectedDate && (
              <div className="flex items-center gap-3">
                <span className="text-base md:text-xl text-gray-600">
                  {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日（{WEEKDAYS[selectedDate.getDay()]}）
                </span>
                {selectedDate.toDateString() !== getToday().toDateString() && (
                  <button
                    onClick={() => {
                      setSelectedDate(getToday());
                      setCurrentMonth(new Date());
                    }}
                    className="px-4 py-2.5 text-base bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity min-h-[44px]"
                  >
                    今日
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Calendar Sidebar */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-sm">
              {/* Mobile Calendar Toggle */}
              <button
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="w-full p-4 flex items-center justify-between md:hidden"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
                  <span className="font-medium text-gray-900">
                    {selectedDate
                      ? `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}（${WEEKDAYS[selectedDate.getDay()]}）`
                      : 'カレンダーから選択'}
                  </span>
                </div>
                {isCalendarOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Calendar Content */}
              <div className={`${isCalendarOpen ? 'block' : 'hidden'} md:block p-4 md:p-8 border-t md:border-t-0 border-gray-100`}>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() - 1
                        )
                      )
                    }
                    className="p-3 hover:bg-gray-100 rounded-lg min-w-[48px] min-h-[48px] flex items-center justify-center text-gray-900"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="font-medium text-lg md:text-xl text-gray-900">
                    {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                  </span>
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1
                        )
                      )
                    }
                    className="p-3 hover:bg-gray-100 rounded-lg min-w-[48px] min-h-[48px] flex items-center justify-center text-gray-900"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1.5 md:gap-2 text-center">
                  {WEEKDAYS.map((day, i) => (
                    <div
                      key={day}
                      className={`py-2 md:py-3 text-sm md:text-base font-medium ${
                        i === 0
                          ? 'text-red-500'
                          : i === 6
                            ? 'text-blue-500'
                            : 'text-gray-500'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                  {generateCalendarDays().map((date, i) => {
                    if (!date) return <div key={i} />;
                    const count = getReservationCount(date);
                    const isSelected =
                      selectedDate?.toDateString() === date.toDateString();
                    const isToday =
                      date.toDateString() === new Date().toDateString();

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedDate(isSelected ? null : date);
                          setIsCalendarOpen(false); // モバイルでは選択後に閉じる
                        }}
                        className={`aspect-square flex flex-col items-center justify-center rounded-lg min-h-[48px] md:min-h-[64px] transition-colors ${
                          isSelected
                            ? 'bg-[var(--color-accent)] text-white'
                            : isToday
                              ? 'bg-blue-50 font-semibold text-gray-900'
                              : 'hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        <span className="text-base md:text-lg">{date.getDate()}</span>
                        {count > 0 && !isSelected && (
                          <span className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-[var(--color-accent)] rounded-full mt-0.5 md:mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 md:mt-8 flex flex-col gap-3">
                  {selectedDate?.toDateString() !== getToday().toDateString() && (
                    <button
                      onClick={() => {
                        setSelectedDate(getToday());
                        setCurrentMonth(new Date());
                        setIsCalendarOpen(false);
                      }}
                      className="w-full py-3.5 md:py-4 text-base md:text-lg bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity min-h-[48px] md:min-h-[52px]"
                    >
                      今日の予約を表示
                    </button>
                  )}
                  {selectedDate && (
                    <button
                      onClick={() => {
                        setSelectedDate(null);
                        setIsCalendarOpen(false);
                      }}
                      className="w-full py-3.5 md:py-4 text-base md:text-lg text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg min-h-[48px] md:min-h-[52px]"
                    >
                      すべての予約を表示
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Reservations List */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="lg:col-span-2"
          >
            {/* Filters */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm mb-4 flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="名前・メール・メニューで検索"
                    className="w-full pl-12 pr-4 py-3.5 text-base border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)] min-h-[48px]"
                  />
                </div>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3.5 text-base border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)] min-h-[48px] sm:w-auto"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="p-12 md:p-16 text-center text-lg text-gray-500">
                  読み込み中...
                </div>
              ) : filteredReservations.length === 0 ? (
                <div className="p-12 md:p-16 text-center text-lg text-gray-500">
                  {selectedDate ? (
                    <>
                      {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日の予約はありません
                    </>
                  ) : (
                    '予約が見つかりません'
                  )}
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {filteredReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        id={`reservation-${reservation.id}`}
                        className={`p-4 md:p-6 transition-colors ${
                          highlightId === reservation.id
                            ? 'bg-[var(--color-accent-light)]/30 ring-2 ring-[var(--color-accent)] ring-inset'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Mobile Layout */}
                        <div className="md:hidden">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="text-sm text-gray-500">
                                {formatDate(reservation.date)}
                              </p>
                              <p className="text-xl font-medium">
                                {reservation.startTime}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1.5 text-sm rounded ${STATUS_STYLES[reservation.status]}`}
                            >
                              {STATUS_LABELS[reservation.status]}
                            </span>
                          </div>
                          {/* カラーセグメント */}
                          {reservation.items?.length > 0 && (
                            <div className="flex gap-0.5 mb-2">
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
                          )}
                          <p className="font-medium text-base mb-1">
                            {reservation.menuSummary}
                          </p>
                          <p className="text-sm text-gray-500 mb-1">
                            {reservation.user.name || '名前未登録'}
                          </p>
                          {reservation.user.phone && (
                            <p className="text-sm text-gray-500 mb-2">
                              {reservation.user.phone}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-lg text-[var(--color-gold)]">
                              ¥{reservation.totalPrice.toLocaleString()}
                            </p>
                            {reservation.status === 'CONFIRMED' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openConfirmDialog(reservation, 'CANCELLED')}
                                  className="p-3 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                                  title="キャンセル"
                                >
                                  <XCircle className="w-6 h-6" />
                                </button>
                                <button
                                  onClick={() => openConfirmDialog(reservation, 'NO_SHOW')}
                                  className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                                  title="無断キャンセル"
                                >
                                  <Clock className="w-6 h-6" />
                                </button>
                              </div>
                            )}
                            {(reservation.status === 'CANCELLED' || reservation.status === 'NO_SHOW') && (
                              <button
                                onClick={() => openConfirmDialog(reservation, 'CONFIRMED')}
                                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                  reservation.status === 'CANCELLED'
                                    ? 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                                    : 'text-red-500 bg-red-50 hover:bg-red-100'
                                }`}
                              >
                                {STATUS_LABELS[reservation.status]}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Desktop/Tablet Layout */}
                        <div className="hidden md:flex items-start gap-4 md:gap-6">
                          {/* Date & Time */}
                          <div className="w-28 md:w-32 text-center flex-shrink-0">
                            <p className="text-base text-gray-500">
                              {formatDate(reservation.date)}
                            </p>
                            <p className="text-xl md:text-2xl font-medium">
                              {reservation.startTime}
                            </p>
                          </div>

                          {/* Color indicator */}
                          {reservation.items?.length > 0 && (
                            <div className="flex gap-0.5 w-16 flex-shrink-0 mt-2">
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
                          )}

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-medium text-base md:text-lg truncate">
                                {reservation.menuSummary}
                              </p>
                              <span
                                className={`px-3 py-1 text-sm rounded ${STATUS_STYLES[reservation.status]}`}
                              >
                                {STATUS_LABELS[reservation.status]}
                              </span>
                            </div>
                            <p className="text-base text-gray-500">
                              {reservation.user.name || '名前未登録'}
                              {reservation.user.phone && ` ・ ${reservation.user.phone}`}
                              {reservation.user.email && ` ・ ${reservation.user.email}`}
                            </p>
                            {reservation.note && (
                              <p className="text-base text-gray-400 mt-2 truncate">
                                備考: {reservation.note}
                              </p>
                            )}
                          </div>

                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg md:text-xl text-[var(--color-gold)]">
                              ¥{reservation.totalPrice.toLocaleString()}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {reservation.status === 'CONFIRMED' && (
                              <>
                                <button
                                  onClick={() => openConfirmDialog(reservation, 'CANCELLED')}
                                  className="p-3 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                                  title="キャンセル"
                                >
                                  <XCircle className="w-6 h-6" />
                                </button>
                                <button
                                  onClick={() => openConfirmDialog(reservation, 'NO_SHOW')}
                                  className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                                  title="無断キャンセル"
                                >
                                  <Clock className="w-6 h-6" />
                                </button>
                              </>
                            )}
                            {(reservation.status === 'CANCELLED' || reservation.status === 'NO_SHOW') && (
                              <button
                                onClick={() => openConfirmDialog(reservation, 'CONFIRMED')}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                  reservation.status === 'CANCELLED'
                                    ? 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                                    : 'text-red-500 bg-red-50 hover:bg-red-100'
                                }`}
                              >
                                復元
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="p-4 md:p-6 border-t border-gray-100 flex items-center justify-center gap-6">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-3 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[48px] min-h-[48px] flex items-center justify-center"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <span className="text-base text-gray-500">
                        {page} / {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                        className="p-3 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[48px] min-h-[48px] flex items-center justify-center"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 確認ダイアログ */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* オーバーレイ */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeConfirmDialog}
          />

          {/* ダイアログ */}
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

export default function AdminReservationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 text-gray-900 pt-24 flex items-center justify-center">読み込み中...</div>}>
      <AdminReservationsContent />
    </Suspense>
  );
}
