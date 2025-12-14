'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  Check,
  Calendar,
  User,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface SaleItem {
  id: string;
  itemType: 'MENU' | 'PRODUCT';
  menuName: string | null;
  productName: string | null;
  category: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Payment {
  id: string;
  paymentMethod: string;
  amount: number;
}

interface Sale {
  id: string;
  saleNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  saleDate: string;
  saleTime: string;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  note: string | null;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
  items: SaleItem[];
  payments: Payment[];
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: '現金',
  CREDIT_CARD: 'クレジットカード',
  PAYPAY: 'PayPay',
  LINE_PAY: 'LINE Pay',
  RAKUTEN_PAY: '楽天ペイ',
  AU_PAY: 'au PAY',
  D_PAYMENT: 'd払い',
  MERPAY: 'メルペイ',
  BANK_TRANSFER: '銀行振込',
  OTHER: 'その他',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: '未払い',
  PAID: '支払済',
  REFUNDED: '返金済',
  CANCELLED: 'キャンセル',
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  REFUNDED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function SalesListPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  // Expanded items
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingSale, setDeletingSale] = useState<{ id: string; saleNumber: string } | null>(null);

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate, customerName, paymentMethod, paymentStatus]);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (customerName) params.append('customerName', customerName);
      if (paymentMethod) params.append('paymentMethod', paymentMethod);
      if (paymentStatus) params.append('paymentStatus', paymentStatus);

      const url = `/api/admin/sales${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const data = await res.json();
      setSales(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const openDeleteModal = (id: string, saleNumber: string) => {
    setDeletingSale({ id, saleNumber });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSale) return;

    try {
      const res = await fetch(`/api/admin/sales/${deletingSale.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      setIsDeleteModalOpen(false);
      setDeletingSale(null);
      fetchSales();
      showSuccess('会計を削除しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getItemsSummary = (items: SaleItem[]) => {
    const menuNames = items
      .filter((item) => item.itemType === 'MENU')
      .map((item) => item.menuName);
    const productNames = items
      .filter((item) => item.itemType === 'PRODUCT')
      .map((item) => `${item.productName} x${item.quantity}`);

    const all = [...menuNames, ...productNames];
    if (all.length === 0) return 'なし';
    if (all.length <= 2) return all.join(', ');
    return `${all[0]} 他${all.length - 1}件`;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
      <div className="container-wide max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <Link
            href="/admin/pos"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-4 px-3 py-2 -ml-3 min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            POSダッシュボードに戻る
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">会計履歴</h1>
            <Link
              href="/admin/pos/sales/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 !text-white font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              新規会計登録
            </Link>
          </div>
        </motion.div>

        {/* Notifications */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">顧客名</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="顧客名で検索"
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支払方法</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
              >
                <option value="">すべて</option>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支払ステータス</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
              >
                <option value="">すべて</option>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Sales List */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">読み込み中...</div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              会計履歴がありません
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sales.map((sale) => {
                const isExpanded = expandedIds.has(sale.id);

                return (
                  <div key={sale.id} className="hover:bg-gray-50 transition-colors">
                    {/* Collapsed View */}
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start gap-4">
                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <p className="font-medium text-[var(--color-charcoal)]">{sale.saleNumber}</p>
                            <span
                              className={`px-2 py-0.5 text-xs rounded ${
                                PAYMENT_STATUS_STYLES[sale.paymentStatus] || 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {PAYMENT_STATUS_LABELS[sale.paymentStatus] || sale.paymentStatus}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {formatDate(sale.saleDate)} {sale.saleTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{sale.customerName || sale.user?.name || '名前未登録'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              <span>{PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}</span>
                            </div>
                            <p className="text-gray-500">{getItemsSummary(sale.items)}</p>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl text-[var(--color-gold)] font-medium mb-2">
                            {formatPrice(sale.totalAmount)}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpanded(sale.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="詳細"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <Link
                              href={`/admin/pos/sales/${sale.id}`}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="詳細"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/admin/pos/sales/${sale.id}/edit`}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="編集"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => openDeleteModal(sale.id, sale.saleNumber)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="削除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 sm:px-6 pb-4 border-t border-gray-100"
                      >
                        <div className="pt-4 space-y-3">
                          {/* Items */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">明細</p>
                            <div className="space-y-1">
                              {sale.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">
                                      {item.itemType === 'MENU' ? item.menuName : item.productName}
                                    </span>
                                    {item.quantity > 1 && (
                                      <span className="text-gray-400">x{item.quantity}</span>
                                    )}
                                  </div>
                                  <span className="text-gray-700">{formatPrice(item.subtotal)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Summary */}
                          <div className="pt-2 border-t border-gray-100 space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">小計</span>
                              <span>{formatPrice(sale.subtotal)}</span>
                            </div>
                            {sale.discountAmount > 0 && (
                              <div className="flex items-center justify-between text-sm text-red-600">
                                <span>割引</span>
                                <span>-{formatPrice(sale.discountAmount)}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">消費税（{sale.taxRate}%）</span>
                              <span>{formatPrice(sale.taxAmount)}</span>
                            </div>
                          </div>

                          {/* Payments */}
                          {sale.payments.length > 1 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">支払詳細</p>
                              <div className="space-y-1">
                                {sale.payments.map((payment, index) => (
                                  <div key={payment.id} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                      {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                                    </span>
                                    <span>{formatPrice(payment.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Note */}
                          {sale.note && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">備考</p>
                              <p className="text-sm text-gray-600">{sale.note}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && deletingSale && (
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
              className="relative bg-white rounded-lg shadow-xl w-full max-w-sm md:max-w-md mx-4"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-center mb-2">削除の確認</h3>
                <p className="text-gray-500 text-center mb-6">
                  会計「{deletingSale.saleNumber}」を削除してもよろしいですか？
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
