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
  UserPlus,
  Pencil,
  Trash2,
  AlertTriangle,
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
    completedReservations: number;
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

  // 顧客追加モーダル
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // 顧客編集モーダル
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' });
  const [editError, setEditError] = useState<string | null>(null);

  // 顧客削除ダイアログ
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
            _count: {
              reservations: 1,
              completedReservations: r.status === 'COMPLETED' ? 1 : 0,
            },
          });
        } else {
          const existing = customerMap.get(r.user.id)!;
          existing.reservations.push(r);
          existing._count.reservations += 1;
          if (r.status === 'COMPLETED') {
            existing._count.completedReservations += 1;
          }
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

  // 顧客追加
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAddError(null);

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || '顧客の追加に失敗しました');
        return;
      }

      // 成功したら顧客リストを更新
      setCustomers(prev => [{
        ...data,
        reservations: [],
        _count: { reservations: 0, completedReservations: 0 },
      }, ...prev]);

      // モーダルを閉じてフォームをリセット
      setIsAddModalOpen(false);
      setNewCustomer({ name: '', phone: '', email: '' });
    } catch {
      setAddError('顧客の追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 編集モーダルを開く
  const openEditModal = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // 顧客編集
  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setIsSubmitting(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          email: editForm.email || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || '顧客情報の更新に失敗しました');
        return;
      }

      // 成功したら顧客リストを更新
      setCustomers(prev =>
        prev.map(c =>
          c.id === editingCustomer.id
            ? { ...c, name: data.name, phone: data.phone, email: data.email }
            : c
        )
      );

      // モーダルを閉じる
      setIsEditModalOpen(false);
      setEditingCustomer(null);
    } catch {
      setEditError('顧客情報の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 削除ダイアログを開く
  const openDeleteDialog = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCustomer(customer);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  // 顧客削除
  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/customers/${deletingCustomer.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || '顧客の削除に失敗しました');
        return;
      }

      // 成功したら顧客リストから削除
      setCustomers(prev => prev.filter(c => c.id !== deletingCustomer.id));

      // ダイアログを閉じる
      setIsDeleteDialogOpen(false);
      setDeletingCustomer(null);
    } catch {
      setDeleteError('顧客の削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
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
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-4 px-3 py-2 -ml-3 min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            ダッシュボードに戻る
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-medium">顧客管理</h1>
              <p className="text-gray-500">{customers.length}名</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">新規顧客追加</span>
            </button>
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
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleCustomer(customer.id)}
                        onKeyDown={(e) => e.key === 'Enter' && toggleCustomer(customer.id)}
                        className="w-full p-4 sm:p-6 hover:bg-gray-50 transition-colors text-left cursor-pointer"
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

                          {/* Stats & Actions */}
                          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                            {/* Stats */}
                            <div className="flex gap-3 sm:gap-4">
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>予約</span>
                                </div>
                                <p className="text-lg sm:text-xl font-light text-gray-600">
                                  {customer._count.reservations}<span className="text-xs text-gray-400">回</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                  <Clock className="w-3 h-3" />
                                  <span>完了</span>
                                </div>
                                <p className="text-lg sm:text-xl font-light text-[var(--color-accent)]">
                                  {customer._count.completedReservations}<span className="text-xs text-gray-400">回</span>
                                </p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => openEditModal(customer, e)}
                                className="p-2 text-gray-400 hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-lg transition-colors"
                                title="編集"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => openDeleteDialog(customer, e)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="削除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

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

      {/* 顧客追加モーダル */}
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
              className="relative bg-white rounded-xl shadow-xl max-w-md md:max-w-lg w-full p-6"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[var(--color-accent)]/10 rounded-full">
                  <UserPlus className="w-6 h-6 text-[var(--color-accent)]" />
                </div>
                <h3 className="text-xl font-medium text-gray-900">新規顧客追加</h3>
              </div>

              {addError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {addError}
                </div>
              )}

              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                    placeholder="山田 太郎"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                    placeholder="090-1234-5678"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス（任意）
                  </label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                    placeholder="example@email.com"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 px-4 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newCustomer.name || !newCustomer.phone}
                    className="flex-1 py-3 px-4 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '追加中...' : '追加する'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 顧客編集モーダル */}
      <AnimatePresence>
        {isEditModalOpen && editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsEditModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl max-w-md md:max-w-lg w-full p-6"
            >
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[var(--color-accent)]/10 rounded-full">
                  <Pencil className="w-6 h-6 text-[var(--color-accent)]" />
                </div>
                <h3 className="text-xl font-medium text-gray-900">顧客情報を編集</h3>
              </div>

              {editError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                    placeholder="山田 太郎"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                    placeholder="090-1234-5678"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス（任意）
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                    placeholder="example@email.com"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-3 px-4 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !editForm.name || !editForm.phone}
                    className="flex-1 py-3 px-4 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '更新中...' : '更新する'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 顧客削除確認ダイアログ */}
      <AnimatePresence>
        {isDeleteDialogOpen && deletingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsDeleteDialogOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl max-w-md md:max-w-lg w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-900">顧客を削除</h3>
              </div>

              <p className="text-gray-600 mb-2">
                以下の顧客を削除してもよろしいですか？
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="font-medium text-gray-900">
                  {deletingCustomer.name || '名前未登録'}
                </p>
                {deletingCustomer.phone && (
                  <p className="text-sm text-gray-500">{deletingCustomer.phone}</p>
                )}
                {deletingCustomer.email && (
                  <p className="text-sm text-gray-500">{deletingCustomer.email}</p>
                )}
                {deletingCustomer._count.reservations > 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    ※ この顧客には {deletingCustomer._count.reservations} 件の予約履歴があります。
                    削除すると予約履歴も一緒に削除されます。
                  </p>
                )}
              </div>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="flex-1 py-3 px-4 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCustomer}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? '削除中...' : '削除する'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
