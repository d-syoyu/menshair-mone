'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
  Receipt,
  FileText,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface SaleItem {
  id: string;
  itemType: 'MENU' | 'PRODUCT';
  menuId: string | null;
  menuName: string | null;
  productId: string | null;
  productName: string | null;
  category: string | null;
  duration: number | null;
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
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  reservation: {
    id: string;
    date: string;
    startTime: string;
    status: string;
  } | null;
  items: SaleItem[];
  payments: Payment[];
  createdByUser: {
    id: string;
    name: string | null;
  } | null;
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

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    fetchSale();
  }, [saleId]);

  const fetchSale = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/sales/${saleId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('会計が見つかりません');
          return;
        }
        throw new Error('データの取得に失敗しました');
      }
      const data = await res.json();
      setSale(data);
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

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/sales/${saleId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }
      router.push('/admin/pos/sales');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
      setIsDeleteModalOpen(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;
    try {
      const res = await fetch(`/api/admin/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }
      const updatedSale = await res.json();
      setSale(updatedSale);
      showSuccess('ステータスを更新しました');
      setIsStatusModalOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
        <div className="container-wide max-w-4xl mx-auto px-4">
          <div className="p-12 text-center text-gray-500">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
        <div className="container-wide max-w-4xl mx-auto px-4">
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">会計が見つかりません</p>
            <Link
              href="/admin/pos/sales"
              className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              会計履歴に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            href="/admin/pos/sales"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            会計履歴に戻る
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-2">会計詳細</h1>
              <div className="flex items-center gap-3">
                <span className="text-lg text-gray-600">{sale.saleNumber}</span>
                <button
                  onClick={() => {
                    setNewStatus(sale.paymentStatus);
                    setIsStatusModalOpen(true);
                  }}
                  className={`px-3 py-1 text-sm rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                    PAYMENT_STATUS_STYLES[sale.paymentStatus] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {PAYMENT_STATUS_LABELS[sale.paymentStatus] || sale.paymentStatus}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/pos/sales/${sale.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                編集
              </Link>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                削除
              </button>
            </div>
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

        <div className="space-y-6">
          {/* Sale Info Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[var(--color-gold)]" />
              会計情報
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">売上日</p>
                  <p className="font-medium">{formatDate(sale.saleDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">時刻</p>
                  <p className="font-medium">{sale.saleTime}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Customer Info Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--color-gold)]" />
              顧客情報
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">顧客名</p>
                  <p className="font-medium">
                    {sale.customerName || sale.user?.name || '名前未登録'}
                  </p>
                </div>
              </div>
              {(sale.customerPhone || sale.user?.phone) && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">電話番号</p>
                    <p className="font-medium">{sale.customerPhone || sale.user?.phone}</p>
                  </div>
                </div>
              )}
              {sale.user?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">メールアドレス</p>
                    <p className="font-medium">{sale.user.email}</p>
                  </div>
                </div>
              )}
              {sale.reservation && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">紐付け予約</p>
                  <Link
                    href={`/admin/reservations`}
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {new Date(sale.reservation.date).toLocaleDateString('ja-JP')} {sale.reservation.startTime}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Items Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--color-gold)]" />
              明細
            </h2>
            <div className="space-y-3">
              {sale.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          item.itemType === 'MENU'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {item.itemType === 'MENU' ? 'メニュー' : '商品'}
                      </span>
                      <span className="font-medium">
                        {item.itemType === 'MENU' ? item.menuName : item.productName}
                      </span>
                    </div>
                    {item.category && (
                      <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(item.subtotal)}</p>
                    <p className="text-sm text-gray-500">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Payment Summary Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[var(--color-gold)]" />
              支払情報
            </h2>

            {/* Amount Summary */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">小計</span>
                <span>{formatPrice(sale.subtotal)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex items-center justify-between text-red-600">
                  <span>割引</span>
                  <span>-{formatPrice(sale.discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">消費税（{sale.taxRate}%）</span>
                <span>{formatPrice(sale.taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-lg font-medium">合計</span>
                <span className="text-2xl text-[var(--color-gold)] font-medium">
                  {formatPrice(sale.totalAmount)}
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">支払方法</p>
              <div className="space-y-2">
                {sale.payments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                    </span>
                    <span className="font-medium">{formatPrice(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Note Card */}
          {sale.note && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-medium mb-4">備考</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{sale.note}</p>
            </motion.div>
          )}

          {/* Metadata */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-sm text-gray-400 space-y-1"
          >
            <p>作成日時: {formatDateTime(sale.createdAt)}</p>
            {sale.createdByUser && (
              <p>作成者: {sale.createdByUser.name || '不明'}</p>
            )}
            <p>更新日時: {formatDateTime(sale.updatedAt)}</p>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
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
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-center mb-2">削除の確認</h3>
                <p className="text-gray-500 text-center mb-6">
                  会計「{sale.saleNumber}」を削除してもよろしいですか？
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

      {/* Status Change Modal */}
      <AnimatePresence>
        {isStatusModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsStatusModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">ステータス変更</h3>
                  <button
                    onClick={() => setIsStatusModalOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 mb-6">
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                    <label
                      key={value}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        newStatus === value
                          ? 'bg-[var(--color-accent)]/10 border-2 border-[var(--color-accent)]'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={value}
                        checked={newStatus === value}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="sr-only"
                      />
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          PAYMENT_STATUS_STYLES[value] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsStatusModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleStatusChange}
                    className="px-4 py-2 bg-[var(--color-charcoal)] text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    変更する
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
