'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarOff,
  CalendarCheck,
  Check,
  AlertTriangle,
  Trash2,
  X,
  Settings,
  Plus,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

interface Holiday {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt: string;
}

interface SpecialOpenDay {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt: string;
}

type ModalMode = 'holiday' | 'specialOpen';

interface TimeRange {
  id: string;
  startTime: string;
  endTime: string;
}

export default function AdminBusinessPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [specialOpenDays, setSpecialOpenDays] = useState<SpecialOpenDay[]>([]);
  const [closedDays, setClosedDays] = useState<number[]>([1]); // デフォルトは月曜
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingClosedDays, setIsSavingClosedDays] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('holiday');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);
  const [deletingSpecialOpenDay, setDeletingSpecialOpenDay] = useState<SpecialOpenDay | null>(null);
  const [reason, setReason] = useState('');
  const [holidayType, setHolidayType] = useState<'allDay' | 'timeRange'>('allDay');
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { id: '1', startTime: '10:00', endTime: '12:00' }
  ]);
  const [existingHolidays, setExistingHolidays] = useState<Holiday[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 特別営業日用のstate
  const [specialOpenType, setSpecialOpenType] = useState<'allDay' | 'timeRange'>('allDay');
  const [specialOpenTimeRanges, setSpecialOpenTimeRanges] = useState<TimeRange[]>([
    { id: '1', startTime: '10:00', endTime: '18:00' }
  ]);
  const [existingSpecialOpenDays, setExistingSpecialOpenDays] = useState<SpecialOpenDay[]>([]);

  // 営業設定を取得
  const fetchBusinessSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/business-settings');
      if (res.ok) {
        const data = await res.json();
        setClosedDays(data.closedDays || [1]);
      }
    } catch (err) {
      console.error('Failed to fetch business settings:', err);
    }
  }, []);

  // 不定休を取得
  const fetchHolidays = useCallback(async () => {
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
    }
  }, [currentMonth]);

  // 特別営業日を取得
  const fetchSpecialOpenDays = useCallback(async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const res = await fetch(`/api/admin/special-open-days?year=${year}&month=${month}`);

      if (!res.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const data = await res.json();
      setSpecialOpenDays(data);
    } catch (err) {
      console.error('Failed to fetch special open days:', err);
    }
  }, [currentMonth]);

  // 全データを取得
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchBusinessSettings(), fetchHolidays(), fetchSpecialOpenDays()]);
    setIsLoading(false);
  }, [fetchBusinessSettings, fetchHolidays, fetchSpecialOpenDays]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // 定休日設定を保存
  const handleSaveClosedDays = async () => {
    setIsSavingClosedDays(true);
    try {
      const res = await fetch('/api/admin/business-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closedDays }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存に失敗しました');
      }

      showSuccess('定休日を保存しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsSavingClosedDays(false);
    }
  };

  // 定休日曜日をトグル
  const toggleClosedDay = (dayIndex: number) => {
    setClosedDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort((a, b) => a - b);
      }
    });
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

  // 特別営業日かどうかをチェック
  const getSpecialOpenDay = (date: Date): SpecialOpenDay | undefined => {
    const dateStr = formatDateForApi(date);
    return specialOpenDays.find(s => s.date.startsWith(dateStr));
  };

  // 定休日（設定された曜日）かどうか
  const isClosedDay = (date: Date): boolean => {
    return closedDays.includes(date.getDay());
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

  // 時間帯を追加
  const addTimeRange = () => {
    const newId = Date.now().toString();
    setTimeRanges(prev => [...prev, { id: newId, startTime: '10:00', endTime: '12:00' }]);
  };

  // 時間帯を削除
  const removeTimeRange = (id: string) => {
    setTimeRanges(prev => prev.filter(tr => tr.id !== id));
  };

  // 時間帯を更新
  const updateTimeRange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setTimeRanges(prev => prev.map(tr =>
      tr.id === id ? { ...tr, [field]: value } : tr
    ));
  };

  // 特別営業日用の時間帯を追加
  const addSpecialOpenTimeRange = () => {
    const newId = Date.now().toString();
    setSpecialOpenTimeRanges(prev => [...prev, { id: newId, startTime: '10:00', endTime: '18:00' }]);
  };

  // 特別営業日用の時間帯を削除
  const removeSpecialOpenTimeRange = (id: string) => {
    setSpecialOpenTimeRanges(prev => prev.filter(tr => tr.id !== id));
  };

  // 特別営業日用の時間帯を更新
  const updateSpecialOpenTimeRange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setSpecialOpenTimeRanges(prev => prev.map(tr =>
      tr.id === id ? { ...tr, [field]: value } : tr
    ));
  };

  // 特別営業日を取得（複数ある場合は配列で返す）
  const getSpecialOpenDays = (date: Date): SpecialOpenDay[] => {
    const dateStr = formatDateForApi(date);
    return specialOpenDays.filter(s => s.date.startsWith(dateStr));
  };

  // 日付クリック
  const handleDateClick = (date: Date) => {
    const isClosed = isClosedDay(date);
    const dayHolidays = getHolidays(date);
    const daySpecialOpenDays = getSpecialOpenDays(date);

    if (isClosed) {
      // 定休日の場合 - 特別営業日を追加（既存があっても追加可能）
      setSelectedDate(date);
      setModalMode('specialOpen');
      setReason('');
      setSpecialOpenType('allDay');
      setSpecialOpenTimeRanges([{ id: '1', startTime: '10:00', endTime: '18:00' }]);
      setExistingSpecialOpenDays(daySpecialOpenDays);
      setIsAddModalOpen(true);
    } else {
      // 通常の日の場合 - 不定休を追加（既存があっても追加可能）
      setSelectedDate(date);
      setModalMode('holiday');
      setReason('');
      setHolidayType('allDay');
      setTimeRanges([{ id: '1', startTime: '10:00', endTime: '12:00' }]);
      setExistingHolidays(dayHolidays);
      setIsAddModalOpen(true);
    }
  };

  // 不定休追加
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    setIsSubmitting(true);

    try {
      const dateStr = formatDateForApi(selectedDate);

      if (holidayType === 'allDay') {
        // 終日休業の場合
        const body: { date: string; reason?: string } = { date: dateStr };
        if (reason) body.reason = reason;

        const res = await fetch('/api/admin/holidays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'エラーが発生しました');
        }
      } else {
        // 時間帯休業の場合 - 複数の時間帯を順番に登録
        for (const tr of timeRanges) {
          const body: { date: string; startTime: string; endTime: string; reason?: string } = {
            date: dateStr,
            startTime: tr.startTime,
            endTime: tr.endTime,
          };
          if (reason) body.reason = reason;

          const res = await fetch('/api/admin/holidays', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'エラーが発生しました');
          }
        }
      }

      setIsAddModalOpen(false);
      fetchHolidays();
      showSuccess(holidayType === 'allDay' ? '終日休業を追加しました' : `${timeRanges.length}件の時間帯休業を追加しました`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 特別営業日追加
  const handleAddSpecialOpenDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    setIsSubmitting(true);

    try {
      const dateStr = formatDateForApi(selectedDate);

      if (specialOpenType === 'allDay') {
        // 終日営業の場合
        const body: { date: string; reason?: string } = { date: dateStr };
        if (reason) body.reason = reason;

        const res = await fetch('/api/admin/special-open-days', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'エラーが発生しました');
        }
      } else {
        // 時間帯営業の場合 - 複数の時間帯を順番に登録
        for (const tr of specialOpenTimeRanges) {
          const body: { date: string; startTime: string; endTime: string; reason?: string } = {
            date: dateStr,
            startTime: tr.startTime,
            endTime: tr.endTime,
          };
          if (reason) body.reason = reason;

          const res = await fetch('/api/admin/special-open-days', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'エラーが発生しました');
          }
        }
      }

      setIsAddModalOpen(false);
      fetchSpecialOpenDays();
      showSuccess(specialOpenType === 'allDay' ? '終日営業を追加しました' : `${specialOpenTimeRanges.length}件の時間帯営業を追加しました`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsSubmitting(false);
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

  // 特別営業日削除
  const handleDeleteSpecialOpenDay = async () => {
    if (!deletingSpecialOpenDay) return;

    try {
      const res = await fetch(`/api/admin/special-open-days/${deletingSpecialOpenDay.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      setIsDeleteModalOpen(false);
      setDeletingSpecialOpenDay(null);
      fetchSpecialOpenDays();
      showSuccess('特別営業日を削除しました');
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
      <div className="container-wide max-w-5xl mx-auto px-4 sm:px-6">
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
            <h1 className="text-xl sm:text-2xl font-medium">営業管理</h1>
          </div>
          <p className="mt-2 text-gray-500 text-xs sm:text-sm">
            定休日、不定休、特別営業日を設定できます。
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

        {/* 定休日設定 */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-6 bg-white rounded-lg shadow-sm p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-base sm:text-lg font-medium">定休日設定</h2>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mb-4">
            毎週の定休日を選択してください。
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
            {WEEKDAYS.map((day, i) => {
              const isSelected = closedDays.includes(i);
              return (
                <button
                  key={day}
                  onClick={() => toggleClosedDay(i)}
                  className={`
                    px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-gray-800 !text-white'
                      : `bg-gray-100 hover:bg-gray-200 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`
                    }
                  `}
                >
                  {day}曜日
                </button>
              );
            })}
          </div>
          <button
            onClick={handleSaveClosedDays}
            disabled={isSavingClosedDays}
            className="px-4 py-2 bg-[var(--color-accent)] !text-white rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
          >
            {isSavingClosedDays ? '保存中...' : '定休日を保存'}
          </button>
        </motion.div>

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
                        : closedDays.includes(i)
                          ? 'text-gray-400'
                          : 'text-gray-500'
                  }`}
                >
                  {day}
                  {closedDays.includes(i) && <span className="text-[9px] sm:text-[10px] block">定休</span>}
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
                  const specialOpen = getSpecialOpenDay(date);
                  const isPast = isPastDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();

                  // ツールチップ用テキスト
                  const getTooltip = () => {
                    const tips: string[] = [];
                    if (isClosed && !specialOpen) tips.push('定休日');
                    if (isClosed && specialOpen) tips.push(`特別営業日${specialOpen.reason ? `: ${specialOpen.reason}` : ''}`);
                    if (dayHolidays.length > 0) {
                      tips.push(...dayHolidays.map(h => {
                        const timeInfo = h.startTime && h.endTime
                          ? `${h.startTime}〜${h.endTime}`
                          : '終日';
                        return `不定休: ${timeInfo}${h.reason ? ` (${h.reason})` : ''}`;
                      }));
                    }
                    return tips.length > 0 ? tips.join('\n') : undefined;
                  };

                  // 背景色を決定
                  const getDateStyle = () => {
                    if (isClosed && specialOpen) {
                      // 定休日だが特別営業
                      return 'bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300';
                    }
                    if (isClosed) {
                      // 定休日
                      return 'bg-gray-100 text-gray-400 hover:bg-gray-200';
                    }
                    if (hasHoliday) {
                      // 不定休
                      return 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300';
                    }
                    if (isPast) {
                      return 'bg-gray-50 text-gray-400 hover:bg-gray-100';
                    }
                    return 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-200';
                  };

                  return (
                    <button
                      key={i}
                      onClick={() => handleDateClick(date)}
                      className={`
                        aspect-square flex flex-col items-center justify-center text-xs sm:text-sm font-medium
                        rounded-md sm:rounded-lg transition-all relative
                        ${isToday ? 'ring-1 sm:ring-2 ring-[var(--color-charcoal)] ring-offset-1 sm:ring-offset-2' : ''}
                        ${getDateStyle()}
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
                      {isClosed && specialOpen && (
                        <CalendarCheck className="w-2 h-2 sm:w-3 sm:h-3 mt-0.5" />
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
                <span>定休日</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-100 rounded flex items-center justify-center">
                  <CalendarOff className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-red-700" />
                </div>
                <span>不定休</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 rounded flex items-center justify-center">
                  <CalendarCheck className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-green-700" />
                </div>
                <span>特別営業日</span>
              </div>
            </div>

            <p className="mt-4 text-gray-500 text-xs">
              定休日をタップ → 特別営業日として設定<br />
              通常日をタップ → 不定休として設定
            </p>
          </motion.div>

          {/* Right Panel: Lists */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="space-y-4 lg:space-y-6"
          >
            {/* Holiday List */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center gap-2">
                <CalendarOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                {currentMonth.getMonth() + 1}月の不定休
              </h3>

              {holidays.length === 0 ? (
                <p className="text-gray-500 text-xs sm:text-sm py-4 text-center">
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
            </div>

            {/* Special Open Day List */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                {currentMonth.getMonth() + 1}月の特別営業日
              </h3>

              {specialOpenDays.length === 0 ? (
                <p className="text-gray-500 text-xs sm:text-sm py-4 text-center">
                  特別営業日はありません
                </p>
              ) : (
                <div className="space-y-2">
                  {specialOpenDays.map((day) => (
                    <div
                      key={day.id}
                      className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm">
                          {formatDisplayDate(day.date)}
                        </p>
                        {(day.startTime && day.endTime) && (
                          <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                            {day.startTime}〜{day.endTime}
                          </p>
                        )}
                        {!day.startTime && !day.endTime && (
                          <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                            終日営業
                          </p>
                        )}
                        {day.reason && (
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">
                            {day.reason}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setDeletingSpecialOpenDay(day);
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
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Modal */}
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
                  <h2 className="text-base sm:text-lg font-medium">
                    {modalMode === 'holiday' ? '不定休を追加' : '特別営業日を追加'}
                  </h2>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 active:text-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <form onSubmit={modalMode === 'holiday' ? handleAddHoliday : handleAddSpecialOpenDay} className="space-y-3 sm:space-y-4">
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

                  {/* 既存の不定休を表示 */}
                  {modalMode === 'holiday' && existingHolidays.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs sm:text-sm font-medium text-red-700 mb-2">
                        この日の既存の不定休:
                      </p>
                      <div className="space-y-1">
                        {existingHolidays.map((h) => (
                          <div key={h.id} className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-red-600">
                              {h.startTime && h.endTime
                                ? `${h.startTime}〜${h.endTime}`
                                : '終日休業'}
                              {h.reason && ` (${h.reason})`}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddModalOpen(false);
                                setDeletingHoliday(h);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="削除"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {modalMode === 'holiday' && (
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
                  )}

                  {modalMode === 'holiday' && holidayType === 'timeRange' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700">
                          休業時間帯
                        </label>
                        <button
                          type="button"
                          onClick={addTimeRange}
                          className="flex items-center gap-1 text-xs sm:text-sm text-[var(--color-accent)] hover:underline"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          時間帯を追加
                        </button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {timeRanges.map((tr) => (
                          <div key={tr.id} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={tr.startTime}
                              onChange={(e) => updateTimeRange(tr.id, 'startTime', e.target.value)}
                              className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                              required
                            />
                            <span className="text-gray-400 text-xs">〜</span>
                            <input
                              type="time"
                              value={tr.endTime}
                              onChange={(e) => updateTimeRange(tr.id, 'endTime', e.target.value)}
                              className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                              required
                            />
                            {timeRanges.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTimeRange(tr.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="削除"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        複数の時間帯を設定できます（例: 午前と夕方に休業）
                      </p>
                    </div>
                  )}

                  {/* 既存の特別営業日を表示 */}
                  {modalMode === 'specialOpen' && existingSpecialOpenDays.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs sm:text-sm font-medium text-green-700 mb-2">
                        この日の既存の特別営業日:
                      </p>
                      <div className="space-y-1">
                        {existingSpecialOpenDays.map((s) => (
                          <div key={s.id} className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-green-600">
                              {s.startTime && s.endTime
                                ? `${s.startTime}〜${s.endTime}`
                                : '終日営業'}
                              {s.reason && ` (${s.reason})`}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddModalOpen(false);
                                setDeletingSpecialOpenDay(s);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1 text-green-400 hover:text-green-600 hover:bg-green-100 rounded transition-colors"
                              title="削除"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {modalMode === 'specialOpen' && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        営業タイプ
                      </label>
                      <div className="flex gap-3 sm:gap-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="allDay"
                            checked={specialOpenType === 'allDay'}
                            onChange={(e) => setSpecialOpenType(e.target.value as 'allDay' | 'timeRange')}
                            className="mr-1.5 sm:mr-2"
                          />
                          <span className="text-xs sm:text-sm">終日営業</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="timeRange"
                            checked={specialOpenType === 'timeRange'}
                            onChange={(e) => setSpecialOpenType(e.target.value as 'allDay' | 'timeRange')}
                            className="mr-1.5 sm:mr-2"
                          />
                          <span className="text-xs sm:text-sm">時間帯営業</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {modalMode === 'specialOpen' && specialOpenType === 'timeRange' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700">
                          営業時間帯
                        </label>
                        <button
                          type="button"
                          onClick={addSpecialOpenTimeRange}
                          className="flex items-center gap-1 text-xs sm:text-sm text-[var(--color-accent)] hover:underline"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          時間帯を追加
                        </button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {specialOpenTimeRanges.map((tr) => (
                          <div key={tr.id} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={tr.startTime}
                              onChange={(e) => updateSpecialOpenTimeRange(tr.id, 'startTime', e.target.value)}
                              className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                              required
                            />
                            <span className="text-gray-400 text-xs">〜</span>
                            <input
                              type="time"
                              value={tr.endTime}
                              onChange={(e) => updateSpecialOpenTimeRange(tr.id, 'endTime', e.target.value)}
                              className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                              required
                            />
                            {specialOpenTimeRanges.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSpecialOpenTimeRange(tr.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="削除"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        複数の時間帯を設定できます（例: 午前と夕方に営業）
                      </p>
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
                      placeholder={modalMode === 'holiday' ? '例: 臨時休業、研修' : '例: 祝日振替営業'}
                    />
                  </div>

                  <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      disabled={isSubmitting}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        (modalMode === 'holiday' && holidayType === 'timeRange' && timeRanges.length === 0) ||
                        (modalMode === 'specialOpen' && specialOpenType === 'timeRange' && specialOpenTimeRanges.length === 0)
                      }
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm !text-white rounded-lg transition-colors disabled:opacity-50 ${
                        modalMode === 'holiday'
                          ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                          : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
                      }`}
                    >
                      {isSubmitting
                        ? '追加中...'
                        : modalMode === 'holiday'
                          ? holidayType === 'timeRange' && timeRanges.length > 1
                            ? `${timeRanges.length}件の時間帯休業を追加`
                            : '不定休を追加'
                          : specialOpenType === 'timeRange' && specialOpenTimeRanges.length > 1
                            ? `${specialOpenTimeRanges.length}件の時間帯営業を追加`
                            : '特別営業日を追加'}
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

      {/* Delete Special Open Day Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && deletingSpecialOpenDay && (
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
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-green-100 rounded-full">
                  <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-center mb-2">特別営業日を削除</h3>
                <p className="text-gray-500 text-xs sm:text-sm text-center mb-4 sm:mb-6">
                  {formatDisplayDate(deletingSpecialOpenDay.date)}の特別営業日を削除しますか？
                  {(deletingSpecialOpenDay.startTime && deletingSpecialOpenDay.endTime) && (
                    <span className="block mt-1 text-xs sm:text-sm font-medium">
                      時間帯: {deletingSpecialOpenDay.startTime}〜{deletingSpecialOpenDay.endTime}
                    </span>
                  )}
                  {!deletingSpecialOpenDay.startTime && !deletingSpecialOpenDay.endTime && (
                    <span className="block mt-1 text-xs sm:text-sm font-medium">
                      終日営業
                    </span>
                  )}
                  <br />
                  削除すると、この日は通常の定休日に戻ります。
                  {deletingSpecialOpenDay.reason && (
                    <span className="block mt-1 text-xs sm:text-sm">
                      理由: {deletingSpecialOpenDay.reason}
                    </span>
                  )}
                </p>
                <div className="flex justify-center gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeletingSpecialOpenDay(null);
                    }}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDeleteSpecialOpenDay}
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
