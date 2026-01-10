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
  Plus,
  User,
  Check,
  Pencil,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { CATEGORY_COLORS, getCategoryTextColor } from '@/constants/menu';

// DBメニューの型定義
interface DbMenu {
  id: string;
  name: string;
  categoryId: string;
  price: number;
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

interface DbCategory {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  displayOrder: number;
}

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
  couponCode?: string | null;
  couponDiscount?: number;
  coupon?: {
    id: string;
    code: string;
    name: string;
    type: string;
    value: number;
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  items: ReservationItem[];
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// 時間を分に変換
const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

interface Holiday {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

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
  action: 'CANCELLED' | 'NO_SHOW' | 'CONFIRMED' | 'DELETE';
}

interface CustomerOption {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
}

// 時間選択肢を生成（9:00〜21:00、10分刻み）
const TIME_OPTIONS = Array.from({ length: 73 }, (_, i) => {
  const totalMinutes = 9 * 60 + i * 10; // 9:00から10分刻み
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

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
  const [calendarReservations, setCalendarReservations] = useState<Reservation[]>([]); // カレンダー用
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

  // 選択した日付の不定休
  const [selectedDateHolidays, setSelectedDateHolidays] = useState<Holiday[]>([]);

  // 予約追加モーダル
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStep, setAddStep] = useState<'customer' | 'menu' | 'datetime'>('customer');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [expandedNewCategories, setExpandedNewCategories] = useState<string[]>([]);
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('10:00');
  const [reservationNote, setReservationNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // 編集モーダル
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editTab, setEditTab] = useState<'customer' | 'reservation'>('reservation');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editMenuIds, setEditMenuIds] = useState<string[]>([]);
  const [expandedEditCategories, setExpandedEditCategories] = useState<string[]>([]);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // DBメニュー
  const [dbMenus, setDbMenus] = useState<DbMenu[]>([]);
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);

  // メニュー取得
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch('/api/menus');
        const data = await res.json();
        setDbMenus(data.menus || []);
        setDbCategories(data.categories || []);
      } catch (error) {
        console.error('Failed to fetch menus:', error);
      }
    };
    fetchMenus();
  }, []);

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page, selectedDate]);

  // カレンダー用の月全体の予約を取得
  useEffect(() => {
    const fetchCalendarReservations = async () => {
      try {
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const res = await fetch(`/api/reservations?month=${year}-${month}&limit=1000`);
        const data = await res.json();
        setCalendarReservations(data.reservations || []);
      } catch (error) {
        console.error('Failed to fetch calendar reservations:', error);
      }
    };
    fetchCalendarReservations();
  }, [currentMonth]);

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

  // 選択した日付の不定休を取得
  useEffect(() => {
    const fetchHolidays = async () => {
      if (!selectedDate) {
        setSelectedDateHolidays([]);
        return;
      }

      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      try {
        const res = await fetch(`/api/admin/holidays?year=${year}&month=${month}`);
        const data = await res.json();
        const holidaysArray = Array.isArray(data) ? data : (data.holidays || []);
        const dateHolidays = holidaysArray.filter((h: Holiday) => {
          const holidayDateStr = typeof h.date === 'string' ? h.date.slice(0, 10) : '';
          return holidayDateStr === dateStr;
        });
        setSelectedDateHolidays(dateHolidays);
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
        setSelectedDateHolidays([]);
      }
    };

    fetchHolidays();
  }, [selectedDate]);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      let url = `/api/reservations?limit=20&page=${page}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      // 日付パラメータを追加
      if (selectedDate) {
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        url += `&date=${dateStr}`;
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
    action: 'CANCELLED' | 'NO_SHOW' | 'CONFIRMED' | 'DELETE'
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

  // ステータス変更または削除を実行
  const handleStatusChange = async () => {
    const { reservationId, action } = confirmDialog;
    try {
      if (action === 'DELETE') {
        // 削除処理
        const res = await fetch(`/api/admin/reservations/${reservationId}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          setReservations((prev) => prev.filter((r) => r.id !== reservationId));
        }
      } else {
        // ステータス変更処理
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
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      closeConfirmDialog();
    }
  };

  // 予約追加モーダルを開く
  const openAddModal = () => {
    setIsAddModalOpen(true);
    setAddStep('customer');
    setSelectedCustomer(null);
    setNewCustomer({ name: '', phone: '' });
    setIsCreatingCustomer(false);
    setSelectedMenuIds([]);
    setReservationDate(selectedDate ? formatDateForInput(selectedDate) : formatDateForInput(new Date()));
    setReservationTime('10:00');
    setReservationNote('');
    setAddError(null);
    fetchCustomers();
  };

  // 日付をinput用にフォーマット
  const formatDateForInput = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 顧客一覧を取得
  const fetchCustomers = async (query = '') => {
    try {
      const url = query ? `/api/admin/customers?q=${encodeURIComponent(query)}` : '/api/admin/customers';
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data);
    } catch {
      console.error('Failed to fetch customers');
    }
  };

  // 顧客検索
  useEffect(() => {
    if (isAddModalOpen && customerSearch) {
      const timer = setTimeout(() => fetchCustomers(customerSearch), 300);
      return () => clearTimeout(timer);
    }
  }, [customerSearch, isAddModalOpen]);

  // 新規顧客を作成
  const createCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    setIsCreatingCustomer(true);
    setAddError(null);

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error);
        return;
      }

      setSelectedCustomer(data);
      setAddStep('menu');
    } catch {
      setAddError('顧客の作成に失敗しました');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // メニュー選択を切り替え
  const toggleMenu = (menuId: string) => {
    setSelectedMenuIds(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // 選択中のメニュー合計
  const getSelectedMenusTotal = () => {
    const menus = selectedMenuIds.map(id => dbMenus.find(m => m.id === id)).filter((m): m is DbMenu => !!m);
    const totalPrice = menus.reduce((sum, m) => sum + m.price, 0);
    const totalDuration = menus.reduce((sum, m) => sum + m.duration, 0);
    return { totalPrice, totalDuration, menus };
  };

  // 予約を作成
  const createReservation = async () => {
    if (!selectedCustomer || selectedMenuIds.length === 0 || !reservationDate || !reservationTime) return;
    setIsSubmitting(true);
    setAddError(null);

    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedCustomer.id,
          menuIds: selectedMenuIds,
          date: reservationDate,
          startTime: reservationTime,
          note: reservationNote || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error);
        return;
      }

      // 成功したら予約リストを更新してモーダルを閉じる
      fetchReservations();
      setIsAddModalOpen(false);
    } catch {
      setAddError('予約の作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 編集モーダルを開く
  const openEditModal = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setEditTab('reservation');
    setEditCustomerName(reservation.user.name || '');
    setEditCustomerPhone(reservation.user.phone || '');
    setEditMenuIds(reservation.items.map(item => item.menuId));
    setEditDate(formatDateForInput(new Date(reservation.date)));
    setEditTime(reservation.startTime);
    setEditEndTime(reservation.endTime);
    setEditNote(reservation.note || '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // 編集メニュー選択を切り替え
  const toggleEditMenu = (menuId: string) => {
    setEditMenuIds(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // 編集中のメニュー合計
  const getEditMenusTotal = () => {
    const menus = editMenuIds.map(id => dbMenus.find(m => m.id === id)).filter((m): m is DbMenu => !!m);
    const totalPrice = menus.reduce((sum, m) => sum + m.price, 0);
    const totalDuration = menus.reduce((sum, m) => sum + m.duration, 0);
    return { totalPrice, totalDuration, menus };
  };

  // 顧客情報を更新
  const updateCustomer = async () => {
    if (!editingReservation) return;
    setIsEditSubmitting(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/admin/customers/${editingReservation.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCustomerName,
          phone: editCustomerPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error);
        return;
      }

      // 成功したら予約リストを更新
      setReservations(prev =>
        prev.map(r =>
          r.id === editingReservation.id
            ? {
                ...r,
                user: {
                  ...r.user,
                  name: editCustomerName,
                  phone: editCustomerPhone,
                },
              }
            : r
        )
      );
      setEditError(null);
      alert('顧客情報を更新しました');
    } catch {
      setEditError('顧客情報の更新に失敗しました');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // 予約情報を更新
  const updateReservation = async () => {
    if (!editingReservation || editMenuIds.length === 0) return;
    setIsEditSubmitting(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/admin/reservations/${editingReservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuIds: editMenuIds,
          date: editDate,
          startTime: editTime,
          endTime: editEndTime,
          note: editNote || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error);
        return;
      }

      // 成功したら予約リストを更新してモーダルを閉じる
      fetchReservations();
      setIsEditModalOpen(false);
    } catch {
      setEditError('予約情報の更新に失敗しました');
    } finally {
      setIsEditSubmitting(false);
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

  // その日の予約数を取得（カレンダー用データから）
  const getReservationCount = (date: Date) => {
    return calendarReservations.filter((r) => {
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
            <div className="flex items-center gap-3">
              {selectedDate && (
                <>
                  <span className="text-base md:text-xl text-gray-600">
                    {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日（{WEEKDAYS[selectedDate.getDay()]}）
                  </span>
                  {selectedDate.toDateString() !== getToday().toDateString() && (
                    <button
                      onClick={() => {
                        setSelectedDate(getToday());
                        setCurrentMonth(new Date());
                      }}
                      className="px-4 py-2.5 text-base bg-gray-600 text-white rounded-lg hover:opacity-90 transition-opacity min-h-[44px]"
                    >
                      今日
                    </button>
                  )}
                </>
              )}
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">予約追加</span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Calendar Sidebar */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="md:col-span-1"
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
            className="md:col-span-2"
          >
            {/* Timeline View - 選択された日付がある場合のみ表示 */}
            {selectedDate && (
              <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-100">
                  <h2 className="text-base md:text-lg font-medium">
                    {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日（{WEEKDAYS[selectedDate.getDay()]}）のタイムライン
                  </h2>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {/* 不定休表示 */}
                  {selectedDateHolidays.length > 0 && (
                    <div className="p-4 bg-red-50 border-b border-red-100">
                      {selectedDateHolidays.map((holiday) => (
                        <div key={holiday.id} className="flex items-center gap-2 text-red-600">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium">
                            {!holiday.startTime || !holiday.endTime
                              ? `終日休業${holiday.reason ? `（${holiday.reason}）` : ''}`
                              : `${holiday.startTime}〜${holiday.endTime} 休業${holiday.reason ? `（${holiday.reason}）` : ''}`
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {filteredReservations.filter(r => r.status === 'CONFIRMED').length === 0 && (
                    <div className="p-6 text-center text-gray-500 text-sm">
                      この日の予約はありません
                    </div>
                  )}
                  {filteredReservations.filter(r => r.status === 'CONFIRMED').sort((a, b) => a.startTime.localeCompare(b.startTime)).map((reservation) => (
                    <div
                      key={`timeline-${reservation.id}`}
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
                        {reservation.couponDiscount && reservation.couponDiscount > 0 ? (
                          <div className="text-xs">
                            <p className="text-gray-400 line-through">
                              ¥{reservation.totalPrice.toLocaleString()}
                            </p>
                            <p className="text-[var(--color-gold)] font-medium">
                              ¥{(reservation.totalPrice - reservation.couponDiscount).toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--color-gold)]">
                            ¥{reservation.totalPrice.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(reservation)}
                          className="p-2.5 text-blue-500 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="編集"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
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
                      {Array.from({ length: 12 }, (_, i) => {
                        const left = (i / 11) * 100;
                        const translateClass = i === 0
                          ? 'translate-x-0'
                          : i === 11
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
                        {Array.from({ length: 34 }, (_, i) => {
                          const isHourLine = i % 3 === 0;
                          const left = (i / 33) * 100;
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

                      {/* Holidays - 不定休表示 */}
                      {selectedDateHolidays.map((holiday) => {
                        // 全日休業
                        if (!holiday.startTime || !holiday.endTime) {
                          return (
                            <div
                              key={holiday.id}
                              className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
                              title={holiday.reason || '終日休業'}
                            >
                              <span className="text-red-500 text-sm font-medium">
                                {holiday.reason || '終日休業'}
                              </span>
                            </div>
                          );
                        }
                        // 時間帯休業
                        const startMin = timeToMinutes(holiday.startTime) - 600;
                        const endMin = timeToMinutes(holiday.endTime) - 600;
                        const totalMin = 660;
                        const left = Math.max(0, (startMin / totalMin) * 100);
                        const width = Math.min(100 - left, ((endMin - startMin) / totalMin) * 100);
                        return (
                          <div
                            key={holiday.id}
                            className="absolute top-0 bottom-0 bg-red-500/30 flex items-center justify-center"
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`${holiday.startTime}〜${holiday.endTime} ${holiday.reason || '休業'}`}
                          >
                            <span className="text-red-600 text-xs font-medium truncate px-1">
                              {holiday.reason || '休業'}
                            </span>
                          </div>
                        );
                      })}

                      {/* Reservations with color segments */}
                      {filteredReservations.filter(r => r.status === 'CONFIRMED').map((reservation) => {
                        const startMin = timeToMinutes(reservation.startTime) - 600;
                        const endMin = timeToMinutes(reservation.endTime) - 600;
                        const totalMin = 660;
                        const left = (startMin / totalMin) * 100;
                        const width = ((endMin - startMin) / totalMin) * 100;

                        return (
                          <button
                            key={`timeline-bar-${reservation.id}`}
                            onClick={() => {
                              const element = document.getElementById(`reservation-${reservation.id}`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                            className={`absolute top-1.5 bottom-1.5 md:top-2 md:bottom-2 rounded-md md:rounded-lg overflow-hidden
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
                                      <span
                                        className="text-xs font-medium truncate px-1"
                                        style={{ color: getCategoryTextColor(item.category) }}
                                      >
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

                  {/* Reservation Summary for the day */}
                  <div className="flex items-center justify-between px-6 lg:px-8 text-sm text-gray-500">
                    <span>
                      {filteredReservations.filter(r => r.status === 'CONFIRMED').length}件の予約
                    </span>
                    <span>
                      合計 ¥{filteredReservations.filter(r => r.status === 'CONFIRMED').reduce((sum, r) => sum + (r.totalPrice - (r.couponDiscount || 0)), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                        {/* Mobile & Tablet Layout */}
                        <div className="lg:hidden">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="text-sm text-gray-500">
                                {formatDate(reservation.date)}
                              </p>
                              <p className="text-xl font-medium">
                                {reservation.startTime} - {reservation.endTime}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1.5 text-sm rounded ${STATUS_STYLES[reservation.status]}`}
                            >
                              {STATUS_LABELS[reservation.status]}
                            </span>
                          </div>

                          {/* メニュー詳細 */}
                          {reservation.items?.length > 0 && (
                            <div className="mb-3 space-y-2">
                              {reservation.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                  <div
                                    className="w-1 h-10 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#888' }}
                                  />
                                  <div className="flex-1 min-w-[120px]">
                                    <p className="font-medium text-sm break-words">{item.menuName}</p>
                                    <p className="text-xs text-gray-500">{item.category}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0 whitespace-nowrap">
                                    <p className="text-sm font-medium text-gray-900">¥{item.price.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">{item.duration}分</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <p className="text-sm text-gray-500 mb-1">
                            {reservation.user.name || '名前未登録'}
                          </p>
                          {reservation.user.phone && (
                            <p className="text-sm text-gray-500 mb-2">
                              {reservation.user.phone}
                            </p>
                          )}
                          {reservation.note && (
                            <p className="text-sm text-gray-400 mb-2">
                              備考: {reservation.note}
                            </p>
                          )}
                          {reservation.couponDiscount && reservation.couponDiscount > 0 && (
                            <div className="bg-green-50 p-3 rounded-lg mb-2">
                              <p className="text-xs text-green-700 font-medium mb-1">
                                クーポン適用: {reservation.couponCode}
                              </p>
                              <p className="text-sm text-green-600">
                                -{reservation.couponDiscount.toLocaleString()}円割引
                              </p>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <div>
                              {reservation.couponDiscount && reservation.couponDiscount > 0 ? (
                                <>
                                  <p className="text-xs text-gray-400 line-through">
                                    小計: ¥{reservation.totalPrice.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-500">合計（割引後）</p>
                                  <p className="text-lg font-medium text-[var(--color-gold)]">
                                    ¥{(reservation.totalPrice - reservation.couponDiscount).toLocaleString()}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs text-gray-500">合計</p>
                                  <p className="text-lg font-medium text-[var(--color-gold)]">
                                    ¥{reservation.totalPrice.toLocaleString()}
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(reservation)}
                                className="p-3 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                                title="編集"
                              >
                                <Pencil className="w-5 h-5" />
                              </button>
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
                                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
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

                        {/* Desktop Layout */}
                        <div className="hidden lg:block">
                          <div className="flex items-start gap-4 md:gap-6">
                            {/* Date & Time */}
                            <div className="w-28 md:w-36 text-center flex-shrink-0">
                              <p className="text-base text-gray-500">
                                {formatDate(reservation.date)}
                              </p>
                              <p className="text-xl md:text-2xl font-medium">
                                {reservation.startTime}
                              </p>
                              <p className="text-sm text-gray-400">
                                {reservation.endTime}
                              </p>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <p className="text-base text-gray-500">
                                  {reservation.user.name || '名前未登録'}
                                  {reservation.user.phone && ` ・ ${reservation.user.phone}`}
                                </p>
                                <span
                                  className={`px-3 py-1 text-sm rounded ${STATUS_STYLES[reservation.status]}`}
                                >
                                  {STATUS_LABELS[reservation.status]}
                                </span>
                              </div>

                              {/* メニュー詳細 */}
                              {reservation.items?.length > 0 && (
                                <div className="space-y-2 mb-3">
                                  {reservation.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                      <div
                                        className="w-1 h-12 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#888' }}
                                      />
                                      <div className="flex-1 min-w-[150px]">
                                        <p className="font-medium text-base break-words">{item.menuName}</p>
                                        <p className="text-sm text-gray-500">{item.category}</p>
                                      </div>
                                      <div className="flex items-center gap-4 flex-shrink-0 whitespace-nowrap">
                                        <span className="text-sm text-gray-500">{item.duration}分</span>
                                        <span className="text-base font-medium text-gray-900 min-w-[80px] text-right">
                                          ¥{item.price.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {reservation.note && (
                                <p className="text-sm text-gray-400 mt-2">
                                  備考: {reservation.note}
                                </p>
                              )}
                              {reservation.couponDiscount && reservation.couponDiscount > 0 && (
                                <div className="bg-green-50 p-2 rounded mt-2 text-sm">
                                  <p className="text-green-700 font-medium">
                                    クーポン: {reservation.couponCode}
                                  </p>
                                  <p className="text-green-600">
                                    -{reservation.couponDiscount.toLocaleString()}円割引
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Price */}
                            <div className="text-right flex-shrink-0">
                              {reservation.couponDiscount && reservation.couponDiscount > 0 ? (
                                <>
                                  <p className="text-xs text-gray-400 line-through mb-1">
                                    ¥{reservation.totalPrice.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-500 mb-1">合計（割引後）</p>
                                  <p className="text-xl md:text-2xl font-medium text-[var(--color-gold)]">
                                    ¥{(reservation.totalPrice - reservation.couponDiscount).toLocaleString()}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs text-gray-500 mb-1">合計</p>
                                  <p className="text-xl md:text-2xl font-medium text-[var(--color-gold)]">
                                    ¥{reservation.totalPrice.toLocaleString()}
                                  </p>
                                </>
                              )}
                              <p className="text-sm text-gray-400 mt-1">
                                {reservation.totalDuration}分
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => openEditModal(reservation)}
                                className="p-3 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                                title="編集"
                              >
                                <Pencil className="w-5 h-5" />
                              </button>
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
            className="relative bg-white rounded-xl shadow-xl max-w-md md:max-w-lg w-full p-6"
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
                  : confirmDialog.action === 'DELETE'
                    ? 'bg-red-100 text-red-600'
                    : confirmDialog.action === 'CANCELLED'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-red-100 text-red-600'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium">
                {confirmDialog.action === 'CONFIRMED'
                  ? '予約を復元'
                  : confirmDialog.action === 'DELETE'
                    ? '予約を削除'
                    : confirmDialog.action === 'CANCELLED'
                      ? 'キャンセル確認'
                      : '無断キャンセル確認'}
              </h3>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-2">
                {confirmDialog.action === 'CONFIRMED'
                  ? '以下の予約を元に戻しますか？'
                  : confirmDialog.action === 'DELETE'
                    ? '以下の予約を完全に削除しますか？この操作は取り消せません。'
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
                    : confirmDialog.action === 'DELETE'
                      ? 'bg-red-600 hover:bg-red-700'
                      : confirmDialog.action === 'CANCELLED'
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmDialog.action === 'CONFIRMED'
                  ? '予約を復元する'
                  : confirmDialog.action === 'DELETE'
                    ? '削除する'
                    : confirmDialog.action === 'CANCELLED'
                      ? 'キャンセルする'
                      : '無断キャンセルにする'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 予約追加モーダル */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsAddModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl max-w-lg md:max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex-shrink-0">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--color-accent)]/10 rounded-full">
                    <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">電話予約を追加</h3>
                    <p className="text-sm text-gray-500">
                      {addStep === 'customer' && '顧客を選択または新規追加'}
                      {addStep === 'menu' && 'メニューを選択'}
                      {addStep === 'datetime' && '日時を確認'}
                    </p>
                  </div>
                </div>

                {/* ステップインジケーター */}
                <div className="flex gap-2 mt-4">
                  {['customer', 'menu', 'datetime'].map((step, i) => (
                    <div
                      key={step}
                      className={`h-1 flex-1 rounded-full ${
                        ['customer', 'menu', 'datetime'].indexOf(addStep) >= i
                          ? 'bg-[var(--color-accent)]'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {addError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {addError}
                  </div>
                )}

                {/* Step 1: Customer Selection */}
                {addStep === 'customer' && (
                  <div className="space-y-4">
                    {/* 既存顧客検索 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        既存のお客様を検索
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          placeholder="名前・電話番号で検索"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                        />
                      </div>
                    </div>

                    {/* 顧客リスト */}
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {customers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          {customerSearch ? '該当するお客様がいません' : '顧客が登録されていません'}
                        </div>
                      ) : (
                        customers.slice(0, 10).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomer(c);
                              setAddStep('menu');
                            }}
                            className="w-full p-3 hover:bg-gray-50 text-left flex items-center gap-3"
                          >
                            <div className="w-8 h-8 bg-[var(--color-accent)]/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-[var(--color-accent)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{c.name || '名前未登録'}</p>
                              <p className="text-xs text-gray-500">{c.phone}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-4 text-sm text-gray-500">または</span>
                      </div>
                    </div>

                    {/* 新規顧客追加 */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        新しいお客様を登録
                      </label>
                      <input
                        type="text"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        placeholder="お名前"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                      />
                      <input
                        type="tel"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        placeholder="電話番号"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                      />
                      <button
                        onClick={createCustomer}
                        disabled={!newCustomer.name || !newCustomer.phone || isCreatingCustomer}
                        className="w-full py-3 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingCustomer ? '登録中...' : '新規登録して次へ'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Menu Selection */}
                {addStep === 'menu' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">{selectedCustomer?.name || '名前未登録'}</p>
                        <p className="text-xs text-gray-500">{selectedCustomer?.phone}</p>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {dbCategories.map(category => {
                        const categoryMenus = dbMenus.filter(m => m.categoryId === category.id);
                        if (categoryMenus.length === 0) return null;

                        const isExpanded = expandedNewCategories.includes(category.id);
                        const selectedCount = categoryMenus.filter(m => selectedMenuIds.includes(m.id)).length;

                        return (
                          <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* カテゴリーヘッダー */}
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedNewCategories(prev =>
                                  prev.includes(category.id)
                                    ? prev.filter(id => id !== category.id)
                                    : [...prev, category.id]
                                );
                              }}
                              className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 transition-colors"
                            >
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: category.color || CATEGORY_COLORS[category.name] }}
                              />
                              <span className="flex-1 text-left font-medium text-gray-700 text-sm">
                                {category.name}
                              </span>
                              {selectedCount > 0 && (
                                <span className="px-2 py-0.5 text-xs bg-[var(--color-accent)] text-white rounded-full">
                                  {selectedCount}
                                </span>
                              )}
                              <ChevronDown
                                className={`w-4 h-4 text-gray-400 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {/* メニューリスト */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="border-t border-gray-200"
                                >
                                  <div className="p-2 space-y-1 bg-gray-50">
                                    {categoryMenus.map(menu => {
                                      const isSelected = selectedMenuIds.includes(menu.id);
                                      return (
                                        <button
                                          key={menu.id}
                                          type="button"
                                          onClick={() => toggleMenu(menu.id)}
                                          className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                                            isSelected
                                              ? 'border-[var(--color-accent)] bg-white'
                                              : 'border-gray-100 bg-white hover:border-gray-200'
                                          }`}
                                        >
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{menu.name}</p>
                                            <p className="text-xs text-gray-500">{menu.duration}分</p>
                                          </div>
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-sm font-medium text-[var(--color-gold)]">¥{menu.price.toLocaleString()}</span>
                                            {isSelected && <Check className="w-4 h-4 text-[var(--color-accent)]" />}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>

                    {selectedMenuIds.length > 0 && (
                      <div className="p-3 bg-[var(--color-gold)]/10 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>合計</span>
                          <span className="font-medium">
                            ¥{getSelectedMenusTotal().totalPrice.toLocaleString()}（{getSelectedMenusTotal().totalDuration}分）
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Date/Time Selection */}
                {addStep === 'datetime' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-gray-500" />
                        <p className="font-medium text-sm">{selectedCustomer?.name || '名前未登録'}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {getSelectedMenusTotal().menus.map(m => m.name).join(' + ')}
                      </div>
                      <div className="text-sm font-medium text-[var(--color-gold)] mt-1">
                        ¥{getSelectedMenusTotal().totalPrice.toLocaleString()}（{getSelectedMenusTotal().totalDuration}分）
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
                        <input
                          type="date"
                          value={reservationDate}
                          onChange={(e) => setReservationDate(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">開始時間</label>
                        <select
                          value={reservationTime}
                          onChange={(e) => setReservationTime(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                        >
                          {TIME_OPTIONS.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">備考（任意）</label>
                      <textarea
                        value={reservationNote}
                        onChange={(e) => setReservationNote(e.target.value)}
                        placeholder="電話予約、初回など"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)] resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-3">
                  {addStep !== 'customer' && (
                    <button
                      onClick={() => setAddStep(addStep === 'datetime' ? 'menu' : 'customer')}
                      className="px-4 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      戻る
                    </button>
                  )}
                  {addStep === 'menu' && (
                    <button
                      onClick={() => setAddStep('datetime')}
                      disabled={selectedMenuIds.length === 0}
                      className="flex-1 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      次へ
                    </button>
                  )}
                  {addStep === 'datetime' && (
                    <button
                      onClick={createReservation}
                      disabled={isSubmitting || !reservationDate || !reservationTime}
                      className="flex-1 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? '予約登録中...' : '予約を登録'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 編集モーダル */}
      <AnimatePresence>
        {isEditModalOpen && editingReservation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsEditModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl max-w-lg md:max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex-shrink-0">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Pencil className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">予約を編集</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(editingReservation.date)} {editingReservation.startTime}
                    </p>
                  </div>
                </div>

                {/* タブ */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditTab('reservation')}
                    className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                      editTab === 'reservation'
                        ? 'bg-[var(--color-accent)] text-white font-medium'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    予約情報
                  </button>
                  <button
                    onClick={() => setEditTab('customer')}
                    className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                      editTab === 'customer'
                        ? 'bg-[var(--color-accent)] text-white font-medium'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    顧客情報
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {editError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {editError}
                  </div>
                )}

                {/* 予約情報タブ */}
                {editTab === 'reservation' && (
                  <div className="space-y-4">
                    {/* 日時 */}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">開始時間</label>
                          <select
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                          >
                            {TIME_OPTIONS.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">終了時間</label>
                          <select
                            value={editEndTime}
                            onChange={(e) => setEditEndTime(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                          >
                            {TIME_OPTIONS.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        ※ 終了時間を手動で変更すると、施術時間が調整されます
                      </p>
                    </div>

                    {/* メニュー選択 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">メニュー</label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {dbCategories.map(category => {
                          const categoryMenus = dbMenus.filter(m => m.categoryId === category.id);
                          if (categoryMenus.length === 0) return null;

                          const isExpanded = expandedEditCategories.includes(category.id);
                          const selectedCount = categoryMenus.filter(m => editMenuIds.includes(m.id)).length;

                          return (
                            <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                              {/* カテゴリーヘッダー */}
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedEditCategories(prev =>
                                    prev.includes(category.id)
                                      ? prev.filter(id => id !== category.id)
                                      : [...prev, category.id]
                                  );
                                }}
                                className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 transition-colors"
                              >
                                <span
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: category.color || CATEGORY_COLORS[category.name] }}
                                />
                                <span className="flex-1 text-left font-medium text-gray-700 text-sm">
                                  {category.name}
                                </span>
                                {selectedCount > 0 && (
                                  <span className="px-2 py-0.5 text-xs bg-[var(--color-accent)] text-white rounded-full">
                                    {selectedCount}
                                  </span>
                                )}
                                <ChevronDown
                                  className={`w-4 h-4 text-gray-400 transition-transform ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>

                              {/* メニューリスト */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="border-t border-gray-200"
                                  >
                                    <div className="p-2 space-y-1 bg-gray-50">
                                      {categoryMenus.map(menu => {
                                        const isSelected = editMenuIds.includes(menu.id);
                                        return (
                                          <button
                                            key={menu.id}
                                            type="button"
                                            onClick={() => toggleEditMenu(menu.id)}
                                            className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-colors text-sm ${
                                              isSelected
                                                ? 'border-[var(--color-accent)] bg-white'
                                                : 'border-gray-100 bg-white hover:border-gray-200'
                                            }`}
                                          >
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-sm truncate">{menu.name}</p>
                                              <p className="text-xs text-gray-500">{menu.duration}分</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              <span className="text-sm font-medium text-[var(--color-gold)]">¥{menu.price.toLocaleString()}</span>
                                              {isSelected && <Check className="w-4 h-4 text-[var(--color-accent)]" />}
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {editMenuIds.length > 0 && (
                      <div className="p-3 bg-[var(--color-gold)]/10 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>合計</span>
                          <span className="font-medium">
                            ¥{getEditMenusTotal().totalPrice.toLocaleString()}（{getEditMenusTotal().totalDuration}分）
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 備考 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">備考（任意）</label>
                      <textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="備考"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)] resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                )}

                {/* 顧客情報タブ */}
                {editTab === 'customer' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg mb-4">
                      <p className="text-xs text-gray-500 mb-1">現在の顧客</p>
                      <p className="font-medium">{editingReservation.user.name || '名前未登録'}</p>
                      <p className="text-sm text-gray-500">{editingReservation.user.phone}</p>
                      {editingReservation.user.email && (
                        <p className="text-sm text-gray-500">{editingReservation.user.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">お名前</label>
                      <input
                        type="text"
                        value={editCustomerName}
                        onChange={(e) => setEditCustomerName(e.target.value)}
                        placeholder="お名前"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">電話番号</label>
                      <input
                        type="tel"
                        value={editCustomerPhone}
                        onChange={(e) => setEditCustomerPhone(e.target.value)}
                        placeholder="電話番号"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                      />
                    </div>

                    <p className="text-xs text-gray-500">
                      ※顧客情報を変更すると、この顧客の他の予約にも反映されます
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    閉じる
                  </button>
                  {editTab === 'reservation' && (
                    <button
                      onClick={() => {
                        if (editingReservation) {
                          setIsEditModalOpen(false);
                          openConfirmDialog(editingReservation, 'DELETE');
                        }
                      }}
                      className="px-4 py-3 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      削除
                    </button>
                  )}
                  {editTab === 'reservation' ? (
                    <button
                      onClick={updateReservation}
                      disabled={isEditSubmitting || editMenuIds.length === 0 || !editDate || !editTime || !editEndTime}
                      className="flex-1 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEditSubmitting ? '更新中...' : '予約を更新'}
                    </button>
                  ) : (
                    <button
                      onClick={updateCustomer}
                      disabled={isEditSubmitting || !editCustomerName || !editCustomerPhone}
                      className="flex-1 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEditSubmitting ? '更新中...' : '顧客情報を更新'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
