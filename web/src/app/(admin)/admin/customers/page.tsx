'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  X,
  XCircle,
} from 'lucide-react';
import { CATEGORY_COLORS } from '@/constants/menu';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface ReservationItem {
  id: string;
  menuName: string;
  category: string;
  price: number;
  duration: number;
}

interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  totalDuration: number;
  menuSummary: string;
  status: string;
  items: ReservationItem[];
}

interface Customer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  reservations: Reservation[];
  _count: {
    reservations: number;
  };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: '確定', color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: '完了', color: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'キャンセル', color: 'bg-gray-100 text-gray-500' },
  NO_SHOW: { label: '無断キャンセル', color: 'bg-red-100 text-red-700' },
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const INITIAL_VISIBLE = 5;
  const LOAD_MORE_COUNT = 10;

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reservations?limit=200');
      const data = await res.json();

      // ユニークな顧客を抽出し、予約履歴も保持
      const customerMap = new Map<string, Customer>();
      data.reservations?.forEach((r: Reservation & { user: { id: string; name: string | null; email: string | null; phone: string | null; } }) => {
        if (!customerMap.has(r.user.id)) {
          customerMap.set(r.user.id, {
            ...r.user,
            createdAt: new Date().toISOString(),
            reservations: [r],
            _count: { reservations: 1 },
          });
        } else {
          const existing = customerMap.get(r.user.id)!;
          existing.reservations.push(r);
          existing._count.reservations += 1;
        }
      });

      // 各顧客の予約を日付順（新しい順）にソート
      customerMap.forEach((customer) => {
        customer.reservations.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime();
          }
          return b.startTime.localeCompare(a.startTime);
        });
      });

      setCustomers(Array.from(customerMap.values()));
      setTotalPages(1);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.includes(query)
    );
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}（${weekdays[date.getDay()]}）`;
  };

  const toggleCustomer = (customerId: string) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
    } else {
      setExpandedCustomerId(customerId);
      // 初回展開時は初期表示件数をセット
      if (!visibleCounts[customerId]) {
        setVisibleCounts(prev => ({ ...prev, [customerId]: INITIAL_VISIBLE }));
      }
    }
  };

  const loadMoreReservations = (customerId: string) => {
    setVisibleCounts(prev => ({
      ...prev,
      [customerId]: (prev[customerId] || INITIAL_VISIBLE) + LOAD_MORE_COUNT,
    }));
  };

  const getVisibleReservations = (customer: Customer) => {
    const count = visibleCounts[customer.id] || INITIAL_VISIBLE;
    return customer.reservations.slice(0, count);
  };

  // 完了した予約のみをカウント（キャンセル・無断キャンセル以外）
  const getCompletedCount = (reservations: Reservation[]) => {
    return reservations.filter(r => r.status !== 'CANCELLED' && r.status !== 'NO_SHOW').length;
  };

  // 合計売上を計算
  const getTotalRevenue = (reservations: Reservation[]) => {
    return reservations
      .filter(r => r.status !== 'CANCELLED' && r.status !== 'NO_SHOW')
      .reduce((sum, r) => sum + r.totalPrice, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
      <div className="container-wide max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            ダッシュボードに戻る
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">顧客管理</h1>
            <p className="text-gray-500">{customers.length}名</p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white p-4 rounded-lg shadow-sm mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="名前・メール・電話番号で検索"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        </motion.div>

        {/* Customer List */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">読み込み中...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              顧客が見つかりません
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => {
                  const isExpanded = expandedCustomerId === customer.id;
                  const completedCount = getCompletedCount(customer.reservations);
                  const totalRevenue = getTotalRevenue(customer.reservations);

                  return (
                    <div key={customer.id}>
                      {/* Customer Row */}
                      <button
                        onClick={() => toggleCustomer(customer.id)}
                        className="w-full p-4 sm:p-6 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Avatar */}
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--color-accent)] rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-base sm:text-lg truncate">
                                {customer.name || '名前未登録'}
                              </p>
                              <ChevronDown
                                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-500">
                              {customer.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{customer.email}</span>
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>{customer.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 mb-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>来店</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-light text-[var(--color-accent)]">
                              {completedCount}<span className="text-sm text-gray-400">回</span>
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Expanded History */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 sm:px-6 pb-4 sm:pb-6 bg-gray-50">
                              {/* Stats Summary */}
                              <div className="flex gap-4 sm:gap-6 py-3 sm:py-4 mb-3 sm:mb-4 border-b border-gray-200">
                                <div>
                                  <p className="text-xs text-gray-500">累計売上</p>
                                  <p className="text-lg sm:text-xl font-medium text-[var(--color-gold)]">
                                    ¥{totalRevenue.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">予約総数</p>
                                  <p className="text-lg sm:text-xl font-medium">
                                    {customer.reservations.length}<span className="text-sm text-gray-400">件</span>
                                  </p>
                                </div>
                              </div>

                              {/* History Title */}
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-gray-700">施術履歴</h4>
                                <span className="text-xs text-gray-500">
                                  {customer.reservations.length}件
                                </span>
                              </div>

                              {/* Reservation List */}
                              <div className="space-y-2 sm:space-y-3 max-h-[500px] overflow-y-auto">
                                {getVisibleReservations(customer).map((reservation) => {
                                  const statusInfo = STATUS_LABELS[reservation.status] || { label: reservation.status, color: 'bg-gray-100' };
                                  const isCancelled = reservation.status === 'CANCELLED' || reservation.status === 'NO_SHOW';

                                  return (
                                    <div
                                      key={reservation.id}
                                      className={`bg-white rounded-lg p-3 sm:p-4 border border-gray-100 ${
                                        isCancelled ? 'opacity-60' : ''
                                      }`}
                                    >
                                      {/* Date & Status */}
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-4 h-4 text-gray-400" />
                                          <span className="text-sm font-medium">
                                            {formatDate(reservation.date)}
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            {reservation.startTime}〜{reservation.endTime}
                                          </span>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded ${statusInfo.color}`}>
                                          {statusInfo.label}
                                        </span>
                                      </div>

                                      {/* Menu Items with Color */}
                                      <div className="flex flex-wrap gap-1.5 mb-2">
                                        {reservation.items.map((item) => (
                                          <span
                                            key={item.id}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded"
                                            style={{
                                              backgroundColor: `${CATEGORY_COLORS[item.category] || '#888'}15`,
                                              borderLeft: `3px solid ${CATEGORY_COLORS[item.category] || '#888'}`,
                                            }}
                                          >
                                            {item.menuName}
                                          </span>
                                        ))}
                                      </div>

                                      {/* Price & Duration */}
                                      <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1 text-gray-500">
                                          <Clock className="w-3.5 h-3.5" />
                                          <span>{reservation.totalDuration}分</span>
                                        </div>
                                        <span className="font-medium text-[var(--color-gold)]">
                                          ¥{reservation.totalPrice.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {customer.reservations.length === 0 && (
                                <p className="text-center text-gray-500 py-4">履歴がありません</p>
                              )}

                              {/* Load More Button */}
                              {customer.reservations.length > (visibleCounts[customer.id] || INITIAL_VISIBLE) && (
                                <button
                                  onClick={() => loadMoreReservations(customer.id)}
                                  className="w-full mt-3 py-2.5 text-sm text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-lg transition-colors border border-[var(--color-accent)]/30"
                                >
                                  もっと見る（残り {customer.reservations.length - (visibleCounts[customer.id] || INITIAL_VISIBLE)}件）
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-500">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
