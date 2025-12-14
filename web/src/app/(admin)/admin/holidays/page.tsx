'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarOff,
  Check,
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const CLOSED_DAY = 1; // 月曜日

interface Holiday {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt: string;
}

export default function AdminHolidaysPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);
  const [reason, setReason] = useState('');
  const [holidayType, setHolidayType] = useState<'allDay' | 'timeRange'>('allDay');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');

  const fetchHolidays = useCallback(async () => {
    setIsLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const res = await fetch(`/api/admin/holidays?year=${year}&month=${month}`);

      if (!res.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const data = await res.json();
      setHolidays(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // カレンダー日付を生成
  const generateCalendarDays = (): (Date | null)[] => {
    const days: (Date | null)[] = [];
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // 月の最初の日の曜日分だけnullを入れる
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // 月の日付を追加
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
    }

    return days;
  };

  // 不定休かどうかをチェック（複数ある場合は配列で返す）
  const getHolidays = (date: Date): Holiday[] => {
    const dateStr = formatDateForApi(date);
    return holidays.filter(h => h.date.startsWith(dateStr));
  };

  // 不定休があるか（後方互換性のため）
  const isHoliday = (date: Date): Holiday | undefined => {
    const dateStr = formatDateForApi(date);
    return holidays.find(h => h.date.startsWith(dateStr));
  };

  // 定休日（月曜日）かどうか
  const isClosedDay = (date: Date): boolean => {
    return date.getDay() === CLOSED_DAY;
  };

  // 過去の日付かどうか
  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate < today;
  };

  const formatDateForApi = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAYS[date.getDay()]}）`;
  };

  // 日付クリック
  const handleDateClick = (date: Date) => {
    if (isClosedDay(date)) return; // 定休日はクリック不可

    const holiday = isHoliday(date);
    if (holiday) {
      // 既に不定休の場合は削除確認
      setDeletingHoliday(holiday);
      setIsDeleteModalOpen(true);
    } else {
      // 不定休を追加
      setSelectedDate(date);
      setReason('');
      setHolidayType('allDay');
      setStartTime('10:00');
      setEndTime('18:00');
      setIsAddModalOpen(true);
    }
  };

  // 不定休追加
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    try {
      const body: {
        date: string;
        startTime?: string;
        endTime?: string;
        reason?: string;
      } = {
        date: formatDateForApi(selectedDate),
      };

      if (holidayType === 'timeRange') {
        body.startTime = startTime;
        body.endTime = endTime;
      }

      if (reason) {
        body.reason = reason;
      }

      const res = await fetch('/api/admin/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      setIsAddModalOpen(false);
      fetchHolidays();
      showSuccess('不定休を追加しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // 不定休削除
  const handleDeleteHoliday = async () => {
    if (!deletingHoliday) return;

    try {
      const res = await fetch(`/api/admin/holidays/${deletingHoliday.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      setIsDeleteModalOpen(false);
      setDeletingHoliday(null);
      fetchHolidays();
      showSuccess('不定休を削除しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // 月を変更
  const changeMonth = (delta: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + delta);
      return newMonth;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-20 sm:pt-24 pb-16 sm:pb-20">
      <div className="container-wide max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-6 sm:mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-4 px-3 py-2 -ml-3 min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            ダッシュボードに戻る
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-medium">不定休設定</h1>
          </div>
          <p className="mt-2 text-gray-500 text-xs sm:text-sm">
            カレンダーをタップして不定休を設定できます。月曜日は定休日です。
          </p>
        </motion.div>

        {/* Notifications */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 sm:mb-4 p-3 sm:p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-xs sm:text-sm"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-xs sm:text-sm"
            >
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Calendar */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4 sm:p-6"
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <h2 className="text-base sm:text-lg font-medium">
                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
              </h2>
              <button
                onClick={() => changeMonth(1)}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
              {WEEKDAYS.map((day, i) => (
                <div
                  key={day}
                  className={`text-center text-[10px] sm:text-xs font-medium py-1 sm:py-2 ${
                    i === 0
                      ? 'text-red-400'
                      : i === 6
                        ? 'text-blue-400'
                        : i === CLOSED_DAY
                          ? 'text-gray-400'
                          : 'text-gray-500'
                  }`}
                >
                  {day}
                  {i === CLOSED_DAY && <span className="text-[9px] sm:text-[10px] block">定休</span>}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            {isLoading ? (
              <div className="py-20 text-center text-gray-500">読み込み中...</div>
            ) : (
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {generateCalendarDays().map((date, i) => {
                  if (!date) {
                    return <div key={i} className="aspect-square" />;
                  }

                  const isClosed = isClosedDay(date);
                  const dayHolidays = getHolidays(date);
                  const hasHoliday = dayHolidays.length > 0;
                  const isPast = isPastDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();

                  // ツールチップ用テキスト
                  const getTooltip = () => {
                    if (isClosed) return '定休日';
                    if (dayHolidays.length === 0) return undefined;
                    return dayHolidays.map(h => {
                      const timeInfo = h.startTime && h.endTime
                        ? `${h.startTime}〜${h.endTime}`
                        : '終日';
                      return `${timeInfo}${h.reason ? `: ${h.reason}` : ''}`;
                    }).join('\n');
                  };

                  return (
                    <button
                      key={i}
                      onClick={() => !isClosed && handleDateClick(date)}
                      disabled={isClosed}
                      className={`
                        aspect-square flex flex-col items-center justify-center text-xs sm:text-sm font-medium
                        rounded-md sm:rounded-lg transition-all relative
                        ${isToday ? 'ring-1 sm:ring-2 ring-[var(--color-charcoal)] ring-offset-1 sm:ring-offset-2' : ''}
                        ${isClosed
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : hasHoliday
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300'
                            : isPast
                              ? 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                              : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-200'
                        }
                        ${date.getDay() === 0 && !isClosed && !hasHoliday ? 'text-red-500' : ''}
                        ${date.getDay() === 6 && !isClosed && !hasHoliday ? 'text-blue-500' : ''}
                      `}
                      title={getTooltip()}
                    >
                      <span className="text-[11px] sm:text-sm">{date.getDate()}</span>
                      {hasHoliday && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <CalendarOff className="w-2 h-2 sm:w-3 sm:h-3" />
                          {dayHolidays.length > 1 && (
                            <span className="text-[8px] sm:text-[10px]">{dayHolidays.length}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-100 rounded" />
                <span>定休日（月曜）</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-100 rounded flex items-center justify-center">
                  <CalendarOff className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-red-700" />
                </div>
                <span>不定休</span>
              </div>
            </div>
          </motion.div>

          {/* Holiday List */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="bg-white rounded-lg shadow-sm p-4 sm:p-6"
          >
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center gap-2">
              <CalendarOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              {currentMonth.getMonth() + 1}月の不定休
            </h3>

            {holidays.length === 0 ? (
              <p className="text-gray-500 text-xs sm:text-sm py-6 sm:py-8 text-center">
                不定休はありません
              </p>
            ) : (
              <div className="space-y-2">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm">
                        {formatDisplayDate(holiday.date)}
                      </p>
                      {(holiday.startTime && holiday.endTime) && (
                        <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                          {holiday.startTime}〜{holiday.endTime}
                        </p>
                      )}
                      {!holiday.startTime && !holiday.endTime && (
                        <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                          終日休業
                        </p>
                      )}
                      {holiday.reason && (
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">
                          {holiday.reason}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setDeletingHoliday(holiday);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 rounded transition-colors flex-shrink-0 ml-2"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Add Holiday Modal */}
      <AnimatePresence>
        {isAddModalOpen && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-medium">不定休を追加</h2>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 active:text-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddHoliday} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      日付
                    </label>
                    <p className="text-base sm:text-lg font-medium">
                      {selectedDate.getFullYear()}年
                      {selectedDate.getMonth() + 1}月
                      {selectedDate.getDate()}日
                      （{WEEKDAYS[selectedDate.getDay()]}）
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      休業タイプ
                    </label>
                    <div className="flex gap-3 sm:gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          value="allDay"
                          checked={holidayType === 'allDay'}
                          onChange={(e) => setHolidayType(e.target.value as 'allDay' | 'timeRange')}
                          className="mr-1.5 sm:mr-2"
                        />
                        <span className="text-xs sm:text-sm">終日休業</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          value="timeRange"
                          checked={holidayType === 'timeRange'}
                          onChange={(e) => setHolidayType(e.target.value as 'allDay' | 'timeRange')}
                          className="mr-1.5 sm:mr-2"
                        />
                        <span className="text-xs sm:text-sm">時間帯休業</span>
                      </label>
                    </div>
                  </div>

                  {holidayType === 'timeRange' && (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          開始時間
                        </label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          終了時間
                        </label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      理由（任意）
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                      placeholder="例: 臨時休業、研修"
                    />
                  </div>

                  <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-red-500 !text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors"
                    >
                      不定休を追加
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Holiday Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && deletingHoliday && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-red-100 rounded-full">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-center mb-2">不定休を削除</h3>
                <p className="text-gray-500 text-xs sm:text-sm text-center mb-4 sm:mb-6">
                  {formatDisplayDate(deletingHoliday.date)}の不定休を削除しますか？
                  {(deletingHoliday.startTime && deletingHoliday.endTime) && (
                    <span className="block mt-1 text-xs sm:text-sm font-medium">
                      時間帯: {deletingHoliday.startTime}〜{deletingHoliday.endTime}
                    </span>
                  )}
                  {!deletingHoliday.startTime && !deletingHoliday.endTime && (
                    <span className="block mt-1 text-xs sm:text-sm font-medium">
                      終日休業
                    </span>
                  )}
                  {deletingHoliday.reason && (
                    <span className="block mt-1 text-xs sm:text-sm">
                      理由: {deletingHoliday.reason}
                    </span>
                  )}
                </p>
                <div className="flex justify-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDeleteHoliday}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors"
                  >
                    削除する
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
