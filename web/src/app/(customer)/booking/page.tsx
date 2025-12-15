'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useInView, type Variants } from 'framer-motion';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  MENU_ITEMS,
  MENU_CATEGORY_LIST,
  calculateMenuTotals,
  CATEGORY_COLORS,
  getCategoryTextColor,
  type MenuItem
} from '@/constants/menu';
import { CLOSED_DAY } from '@/constants/salon';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AvailabilityData {
  date: string;
  dayOfWeek: number;
  isClosed: boolean;
  slots: TimeSlot[];
  totalDuration?: number;
  totalPrice?: number;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// カテゴリーイニシャル（エレガントなタイポグラフィ）
const CATEGORY_INITIALS: Record<string, string> = {
  "カット": "C",
  "カラー": "Co",
  "パーマ": "P",
  "トリートメント": "Tr",
  "縮毛矯正": "St",
  "スパ": "Sp",
  "その他": "+",
};

// カテゴリー英語タイトル
const CATEGORY_TITLES: Record<string, string> = {
  "カット": "Cut",
  "カラー": "Color",
  "パーマ": "Perm",
  "トリートメント": "Treatment",
  "縮毛矯正": "Straightening",
  "スパ": "Head Spa",
  "その他": "Other",
};

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Array<{ date: string; startTime: string | null; endTime: string | null }>>([]);

  // 選択されたメニューの合計を計算
  const selectedMenus = selectedMenuIds.map(id => MENU_ITEMS.find(m => m.id === id)).filter((m): m is MenuItem => m !== undefined);
  const totals = selectedMenuIds.length > 0 ? calculateMenuTotals(selectedMenuIds) : null;

  // 月が変わったら不定休を取得
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const res = await fetch(`/api/holidays?year=${year}&month=${month}`);
        const data = await res.json();
        setHolidays(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
      }
    };
    fetchHolidays();
  }, [currentMonth]);

  // 日付選択時に空き状況を取得
  useEffect(() => {
    if (selectedDate && selectedMenuIds.length > 0) {
      fetchAvailability(selectedDate, selectedMenuIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedMenuIds]);

  // ローカル日付をYYYY-MM-DD形式に変換（タイムゾーン問題を回避）
  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const fetchAvailability = async (date: Date, menuIds: string[]) => {
    setIsLoadingSlots(true);
    setSelectedTime(null);
    try {
      const dateStr = formatDateLocal(date);
      const res = await fetch(`/api/availability?date=${dateStr}&menuIds=${menuIds.join(',')}`);
      const data = await res.json();
      setAvailability(data);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

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

  // 不定休かどうかを確認（全日休業のみ）
  const isHoliday = (date: Date) => {
    const dateStr = formatDateLocal(date);
    return holidays.some(h => h.date === dateStr && !h.startTime && !h.endTime);
  };

  // 時間帯休業があるかを確認
  const hasTimeRangeHoliday = (date: Date) => {
    const dateStr = formatDateLocal(date);
    return holidays.some(h => h.date === dateStr && h.startTime && h.endTime);
  };

  const isDateSelectable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return false;
    if (date.getDay() === CLOSED_DAY) return false;
    if (isHoliday(date)) return false; // 全日休業のみ選択不可

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    if (date > maxDate) return false;

    return true;
  };

  // メニューの選択/解除を切り替え
  const toggleMenuSelect = (menuId: string) => {
    const menu = MENU_ITEMS.find(m => m.id === menuId);
    if (!menu) return;

    if (selectedMenuIds.includes(menuId)) {
      setSelectedMenuIds(prev => prev.filter(id => id !== menuId));
    } else {
      // 同じカテゴリが既に選択されていたら、まず解除
      const existingMenuInCategory = selectedMenuIds.find(id => {
        const m = MENU_ITEMS.find(item => item.id === id);
        return m?.category === menu.category;
      });
      if (existingMenuInCategory) {
        setSelectedMenuIds(prev => [...prev.filter(id => id !== existingMenuInCategory), menuId]);
      } else {
        setSelectedMenuIds(prev => [...prev, menuId]);
      }
    }
    setSelectedDate(null);
    setSelectedTime(null);
    // 選択後にプルダウンを閉じる
    setExpandedCategory(null);
  };

  const handleProceedToDateTime = () => {
    if (selectedMenuIds.length === 0) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDateSelect = (date: Date) => {
    if (!isDateSelectable(date)) return;
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (selectedMenuIds.length === 0 || !selectedDate || !selectedTime) return;

    const dateStr = formatDateLocal(selectedDate);
    const params = new URLSearchParams({
      menuIds: selectedMenuIds.join(','),
      date: dateStr,
      time: selectedTime,
    });
    router.push(`/booking/confirm?${params.toString()}`);
  };

  // カテゴリクリック時
  const handleCategoryClick = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  // カテゴリ内の選択済みメニューを取得
  const getSelectedMenuInCategory = (categoryId: string): MenuItem | undefined => {
    return selectedMenus.find(m => m.category === categoryId);
  };

  return (
    <div className="min-h-screen bg-dark pt-24 md:pt-32">
      {/* Hero Header */}
      <section className="container-wide pb-8 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="text-subheading mb-2 md:mb-4">Reservation</p>
          <h1 className="text-2xl md:text-display text-white mb-4 md:mb-6">ご予約</h1>
          <div className="divider-line mx-auto mb-4 md:mb-8" />
          <p className="text-sm md:text-base text-text-secondary max-w-lg mx-auto px-4">
            各カテゴリから1つずつ、複数のメニューを組み合わせてご予約いただけます。
          </p>
        </motion.div>
      </section>

      {/* Progress Steps */}
      <div className="bg-dark-lighter py-4 md:py-6 mb-6 md:mb-12 border-y border-glass-border">
        <div className="container-wide">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {[
              { num: 1, label: 'メニュー', en: 'Select' },
              { num: 2, label: '日時', en: 'Date & Time' },
              { num: 3, label: '確認', en: 'Confirm' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-medium transition-all ${
                      step >= s.num
                        ? 'bg-accent text-white'
                        : 'bg-glass-light text-text-muted border border-glass-border'
                    }`}
                  >
                    {step > s.num ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : s.num}
                  </div>
                  <span className="mt-1 md:mt-2 text-[10px] md:text-xs text-text-muted">
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`w-8 sm:w-16 md:w-24 h-[2px] mx-2 md:mx-4 transition-all ${
                    step > s.num ? 'bg-accent' : 'bg-glass-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Menu Selection */}
      {step === 1 && (
        <AnimatedSection className="container-wide pb-12 md:pb-20">
          {/* Category Tile Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 md:mb-12">
            {MENU_CATEGORY_LIST.map((category) => {
              const categoryItems = MENU_ITEMS.filter(item => item.category === category.id);
              const categoryColor = CATEGORY_COLORS[category.id] || '#888';
              const selectedMenu = getSelectedMenuInCategory(category.id);
              const isExpanded = expandedCategory === category.id;
              const hasSelection = !!selectedMenu;

              return (
                <motion.div key={category.id} variants={cardVariant} className="relative overflow-visible">
                  {/* Category Tile */}
                  <button
                    onClick={() => handleCategoryClick(category.id)}
                    className={`w-full min-h-[160px] sm:min-h-[170px] md:min-h-[190px] p-3 sm:p-4 md:p-5 border transition-all duration-300 text-left relative group rounded flex flex-col overflow-visible ${
                      hasSelection
                        ? 'bg-dark-lighter border-accent shadow-lg shadow-accent/10'
                        : isExpanded
                          ? 'bg-dark-lighter border-white/30 shadow-xl'
                          : 'bg-dark-lighter border-glass-border hover:border-white/30 hover:shadow-md'
                    }`}
                  >
                    {/* Selection Badge */}
                    {hasSelection && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                        <div
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: categoryColor }}
                        >
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Initial Badge */}
                    <div className="mb-2 sm:mb-3">
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full text-sm sm:text-base font-serif font-light tracking-wide text-white transition-transform group-hover:scale-105"
                        style={{ backgroundColor: categoryColor }}
                      >
                        {CATEGORY_INITIALS[category.id]}
                      </span>
                    </div>

                    {/* Category Info */}
                    <div className="mt-auto flex-1 flex flex-col justify-end">
                      <p className="text-[8px] sm:text-[10px] text-text-muted uppercase tracking-[0.12em] sm:tracking-[0.15em] mb-0.5">
                        {CATEGORY_TITLES[category.id]}
                      </p>
                      <h3 className="font-medium text-xs sm:text-sm md:text-base text-white leading-tight break-words">{category.id}</h3>

                      {selectedMenu ? (
                        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-glass-border">
                          <p className="text-[10px] sm:text-xs text-text-secondary leading-snug break-words">{selectedMenu.name}</p>
                          <p className="text-gold font-light text-xs sm:text-sm mt-0.5">
                            ¥{selectedMenu.price.toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[9px] sm:text-[10px] text-text-muted mt-1">
                          {categoryItems.length}メニュー
                        </p>
                      )}
                    </div>

                    {/* Bottom accent */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 transition-opacity group-hover:opacity-100 rounded-b"
                      style={{ backgroundColor: categoryColor, opacity: hasSelection || isExpanded ? 1 : 0 }}
                    />
                  </button>

                  {/* Expanded Menu List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 right-0 top-full z-20 mt-1 sm:mt-2"
                      >
                        <div className="bg-dark-lighter border border-glass-border shadow-xl rounded overflow-hidden max-h-[60vh] overflow-y-auto">
                          {categoryItems.map((menu, idx) => {
                            const isSelected = selectedMenuIds.includes(menu.id);
                            return (
                              <button
                                key={menu.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMenuSelect(menu.id);
                                }}
                                className={`w-full p-3 sm:p-4 text-left transition-colors ${
                                  idx !== categoryItems.length - 1 ? 'border-b border-glass-border' : ''
                                } ${
                                  isSelected
                                    ? 'bg-accent/20'
                                    : 'hover:bg-glass-light'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 sm:gap-3">
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${
                                      isSelected
                                        ? 'border-accent bg-accent'
                                        : 'border-text-muted'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm sm:text-base text-white leading-snug mb-1">{menu.name}</p>
                                    <div className="flex items-center gap-3 text-xs sm:text-sm">
                                      <span className="text-gold font-medium">¥{menu.price.toLocaleString()}</span>
                                      <span className="text-text-muted">約{menu.duration}分</span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Selected Summary */}
          <AnimatePresence>
            {selectedMenuIds.length > 0 && totals && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="bg-dark-lighter border border-accent/50 rounded p-4 sm:p-6 md:p-8 mb-8 md:mb-12"
              >
                <div className="flex justify-between items-start sm:items-center mb-4 sm:mb-6">
                  <div>
                    <p className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wider mb-0.5 sm:mb-1">
                      Selected Menu
                    </p>
                    <h3 className="text-base sm:text-lg font-medium text-white">選択中のメニュー</h3>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMenuIds([]);
                      setExpandedCategory(null);
                    }}
                    className="text-xs sm:text-sm text-text-muted hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    クリア
                  </button>
                </div>

                {/* Selected Menus List */}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {selectedMenus.map((menu, index) => (
                    <div
                      key={menu.id}
                      className="flex items-start justify-between py-2.5 sm:py-3 border-b border-glass-border gap-3"
                    >
                      <div className="flex items-start gap-2.5 sm:gap-4 min-w-0 flex-1">
                        <span
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 mt-0.5"
                          style={{
                            backgroundColor: CATEGORY_COLORS[menu.category],
                            color: getCategoryTextColor(menu.category)
                          }}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base text-white break-words leading-snug">{menu.name}</p>
                          <p className="text-[10px] sm:text-xs text-text-muted">
                            {menu.category} / 約{menu.duration}分
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <span className="text-gold font-light text-sm sm:text-lg whitespace-nowrap">
                          ¥{menu.price.toLocaleString()}
                        </span>
                        <button
                          onClick={() => toggleMenuSelect(menu.id)}
                          className="text-text-muted hover:text-red-400 transition-colors p-1"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="flex justify-between items-end pt-3 sm:pt-4 border-t border-accent/50">
                  <div>
                    <p className="text-xs sm:text-sm text-text-muted">合計所要時間</p>
                    <p className="text-base sm:text-lg font-medium text-white">約{totals.totalDuration}分</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm text-text-muted">合計金額</p>
                    <p className="text-xl sm:text-2xl font-light text-gold">
                      ¥{totals.totalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next Button */}
          <div className="flex justify-center">
            <button
              onClick={handleProceedToDateTime}
              disabled={selectedMenuIds.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-12 py-3.5 sm:py-4 bg-accent text-white text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-all duration-500 hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
            >
              日時を選択
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </AnimatedSection>
      )}

      {/* Step 2: Date & Time Selection */}
      {step === 2 && selectedMenuIds.length > 0 && totals && (
        <AnimatedSection className="container-narrow pb-12 md:pb-20">
          {/* Selected Menu Summary */}
          <motion.div
            variants={fadeInUp}
            className="bg-dark-lighter border border-glass-border rounded p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
              {selectedMenus.map((menu, index) => (
                <span
                  key={menu.id}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white bg-glass-light rounded"
                  style={{
                    borderLeft: `3px solid ${CATEGORY_COLORS[menu.category]}`,
                  }}
                >
                  <span
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs flex-shrink-0"
                    style={{
                      backgroundColor: CATEGORY_COLORS[menu.category],
                      color: getCategoryTextColor(menu.category)
                    }}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate">{menu.name}</span>
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 pt-3 sm:pt-4 border-t border-glass-border">
              <span className="font-medium text-sm sm:text-base text-gold">
                ¥{totals.totalPrice.toLocaleString()}
                <span className="text-xs sm:text-sm text-text-muted ml-2">
                  （約{totals.totalDuration}分）
                </span>
              </span>
              <button
                onClick={() => setStep(1)}
                className="text-xs sm:text-sm px-4 py-2 bg-accent hover:bg-accent-light text-white border border-accent-light hover:border-accent rounded transition-all self-start sm:self-auto"
              >
                メニューを変更
              </button>
            </div>
          </motion.div>

          {/* Calendar */}
          <motion.div
            variants={fadeInUp}
            className="bg-dark-lighter border border-glass-border rounded p-3 sm:p-4 mb-4 sm:mb-6 max-w-sm mx-auto"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                  )
                }
                className="p-1 hover:bg-glass-light transition-colors rounded text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm sm:text-lg font-medium flex items-center gap-1.5 sm:gap-2 text-white">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
              </div>
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                  )
                }
                className="p-1 hover:bg-glass-light transition-colors rounded text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-0.5">
              {WEEKDAYS.map((day, i) => (
                <div
                  key={day}
                  className={`text-center text-[10px] sm:text-xs py-1 font-medium ${
                    i === 0
                      ? 'text-red-400'
                      : i === 6
                        ? 'text-blue-400'
                        : 'text-text-muted'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {generateCalendarDays().map((date, i) => {
                if (!date) {
                  return <div key={i} className="aspect-square" />;
                }
                const isSelectable = isDateSelectable(date);
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isClosed = date.getDay() === CLOSED_DAY;
                const holiday = isHoliday(date);
                const hasTimeHoliday = hasTimeRangeHoliday(date);

                const getTitle = () => {
                  if (isClosed) return '定休日';
                  if (holiday) return '臨時休業';
                  if (hasTimeHoliday) return '一部時間帯休業';
                  return undefined;
                };

                return (
                  <button
                    key={i}
                    onClick={() => handleDateSelect(date)}
                    disabled={!isSelectable}
                    title={getTitle()}
                    className={`aspect-square flex items-center justify-center text-[11px] sm:text-xs font-medium transition-all rounded relative ${
                      isSelected
                        ? 'bg-accent text-white'
                        : isSelectable
                          ? 'text-white hover:bg-glass-light'
                          : 'text-text-muted/30 cursor-not-allowed'
                    } ${isClosed || holiday ? 'text-text-muted/30' : ''} ${
                      date.getDay() === 0 && isSelectable ? 'text-red-400' : ''
                    } ${date.getDay() === 6 && isSelectable ? 'text-blue-400' : ''}`}
                  >
                    {date.getDate()}
                    {hasTimeHoliday && isSelectable && (
                      <span className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-yellow-400 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-[9px] sm:text-[10px] text-text-muted mt-2 text-center">
              ※ 月曜日は定休日です
            </p>
          </motion.div>

          {/* Time Slots */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-lighter border border-glass-border rounded p-4 sm:p-6 md:p-8"
            >
              <div className="text-sm sm:text-lg font-medium mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 text-white">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                <span>
                  {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日（
                  {WEEKDAYS[selectedDate.getDay()]}）の空き状況
                </span>
              </div>

              {isLoadingSlots ? (
                <div className="text-center py-8 sm:py-12 text-text-muted">
                  <div className="inline-block w-6 h-6 sm:w-8 sm:h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-base">読み込み中...</p>
                </div>
              ) : availability?.isClosed ? (
                <div className="text-center py-8 sm:py-12 text-text-muted text-sm sm:text-base">
                  定休日です
                </div>
              ) : availability?.slots.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-text-muted text-sm sm:text-base">
                  予約可能な時間がありません
                </div>
              ) : (
                <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5 sm:gap-2">
                  {availability?.slots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`py-2.5 sm:py-3 text-xs sm:text-sm font-medium border transition-all rounded ${
                        selectedTime === slot.time
                          ? 'bg-accent text-white border-accent'
                          : slot.available
                            ? 'border-glass-border text-white hover:border-accent'
                            : 'border-glass-border bg-glass-light/30 text-text-muted/50 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6 sm:mt-10">
            <button
              onClick={() => setStep(1)}
              className="order-2 sm:order-1 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase border border-glass-border text-white hover:bg-glass-light transition-colors rounded"
            >
              戻る
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedTime}
              className="order-1 sm:order-2 w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-accent text-white text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-all duration-500 hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed rounded"
            >
              予約内容を確認
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </AnimatedSection>
      )}
    </div>
  );
}
