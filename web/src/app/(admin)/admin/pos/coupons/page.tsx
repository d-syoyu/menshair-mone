'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Percent,
  DollarSign,
  Ticket,
  Calendar,
  Users,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface Coupon {
  id: string;
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  description: string | null;
  validFrom: string;
  validUntil: string;
  usageLimit: number | null;
  usageLimitPerCustomer: number | null;
  usageCount: number;
  minimumAmount: number | null;
  isActive: boolean;
  applicableMenuIds?: string[];
  applicableCategoryIds?: string[];
  applicableWeekdays?: number[];
  startTime?: string | null;
  endTime?: string | null;
  onlyFirstTime?: boolean;
  onlyReturning?: boolean;
  _count?: {
    usages: number;
  };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<{ id: string; name: string } | null>(null);

  // Form state
  const [couponForm, setCouponForm] = useState({
    code: '',
    name: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: 0,
    description: '',
    validFrom: '',
    validUntil: '',
    usageLimit: null as number | null,
    usageLimitPerCustomer: null as number | null,
    minimumAmount: null as number | null,
    isActive: true,
    applicableMenuIds: '' as string,
    applicableCategoryIds: '' as string,
    applicableWeekdays: '' as string,
    startTime: '',
    endTime: '',
    onlyFirstTime: false,
    onlyReturning: false,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/coupons?includeInactive=true&includeExpired=true');

      if (!res.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const data = await res.json();
      setCoupons(data);
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatDateForInput = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const isNotStarted = (validFrom: string) => {
    return new Date(validFrom) > new Date();
  };

  // Coupon handlers
  const openCouponModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm({
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description || '',
        validFrom: formatDateForInput(coupon.validFrom),
        validUntil: formatDateForInput(coupon.validUntil),
        usageLimit: coupon.usageLimit,
        usageLimitPerCustomer: coupon.usageLimitPerCustomer,
        minimumAmount: coupon.minimumAmount,
        isActive: coupon.isActive,
        applicableMenuIds: (coupon.applicableMenuIds || []).join(','),
        applicableCategoryIds: (coupon.applicableCategoryIds || []).join(','),
        applicableWeekdays: (coupon.applicableWeekdays || []).join(','),
        startTime: coupon.startTime || '',
        endTime: coupon.endTime || '',
        onlyFirstTime: coupon.onlyFirstTime ?? false,
        onlyReturning: coupon.onlyReturning ?? false,
      });
    } else {
      setEditingCoupon(null);
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setCouponForm({
        code: '',
        name: '',
        type: 'PERCENTAGE',
        value: 0,
        description: '',
        validFrom: today.toISOString().split('T')[0],
        validUntil: nextMonth.toISOString().split('T')[0],
        usageLimit: null,
        usageLimitPerCustomer: null,
        minimumAmount: null,
        isActive: true,
        applicableMenuIds: '',
        applicableCategoryIds: '',
        applicableWeekdays: '',
        startTime: '',
        endTime: '',
        onlyFirstTime: false,
        onlyReturning: false,
      });
    }
    setIsCouponModalOpen(true);
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : '/api/admin/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';

      const submitData = {
        code: couponForm.code,
        name: couponForm.name,
        type: couponForm.type,
        value: couponForm.value,
        description: couponForm.description || undefined,
        validFrom: couponForm.validFrom,
        validUntil: couponForm.validUntil,
        usageLimit: couponForm.usageLimit,
        usageLimitPerCustomer: couponForm.usageLimitPerCustomer,
        minimumAmount: couponForm.minimumAmount,
        isActive: couponForm.isActive,
        applicableMenuIds: couponForm.applicableMenuIds
          ? couponForm.applicableMenuIds.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        applicableCategoryIds: couponForm.applicableCategoryIds
          ? couponForm.applicableCategoryIds.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        applicableWeekdays: couponForm.applicableWeekdays
          ? couponForm.applicableWeekdays
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
              .map((n) => parseInt(n, 10))
          : [],
        startTime: couponForm.startTime || undefined,
        endTime: couponForm.endTime || undefined,
        onlyFirstTime: couponForm.onlyFirstTime,
        onlyReturning: couponForm.onlyReturning,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      setIsCouponModalOpen(false);
      fetchCoupons();
      showSuccess(editingCoupon ? 'クーポンを更新しました' : 'クーポンを作成しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // Delete handlers
  const openDeleteModal = (id: string, name: string) => {
    setDeletingCoupon({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCoupon) return;

    try {
      const res = await fetch(`/api/admin/coupons/${deletingCoupon.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      const result = await res.json();
      setIsDeleteModalOpen(false);
      setDeletingCoupon(null);
      fetchCoupons();
      showSuccess(result.message || 'クーポンを削除しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  const formatCouponValue = (coupon: Coupon) => {
    if (coupon.type === 'PERCENTAGE') {
      return `${coupon.value}%`;
    } else {
      return `¥${coupon.value.toLocaleString()}`;
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.isActive) {
      return <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">無効</span>;
    }
    if (isExpired(coupon.validUntil)) {
      return <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">期限切れ</span>;
    }
    if (isNotStarted(coupon.validFrom)) {
      return <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">開始前</span>;
    }
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded">上限到達</span>;
    }
    return <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">有効</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
      <div className="container-wide max-w-5xl mx-auto px-4">
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
            <h1 className="text-2xl font-medium">クーポン管理</h1>
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

        {/* Add Button */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-6"
        >
          <button
            onClick={() => openCouponModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            クーポンを追加
          </button>
        </motion.div>

        {/* Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">読み込み中...</div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              クーポンがありません
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                    !coupon.isActive || isExpired(coupon.validUntil) ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      coupon.type === 'PERCENTAGE'
                        ? 'bg-purple-100'
                        : 'bg-green-100'
                    }`}>
                      <Ticket className={`w-5 h-5 ${
                        coupon.type === 'PERCENTAGE'
                          ? 'text-purple-600'
                          : 'text-green-600'
                      }`} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium">{coupon.name}</p>
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded font-mono">
                          {coupon.code}
                        </span>
                        {getStatusBadge(coupon)}
                      </div>
                      {coupon.description && (
                        <p className="text-sm text-gray-500 mb-2">{coupon.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(coupon.validFrom)} 〜 {formatDate(coupon.validUntil)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          利用: {coupon.usageCount}
                          {coupon.usageLimit !== null && ` / ${coupon.usageLimit}`}回
                        </span>
                        {coupon.minimumAmount !== null && (
                          <span>¥{coupon.minimumAmount.toLocaleString()}以上</span>
                        )}
                      </div>
                      <p className="text-lg text-[var(--color-gold)] font-medium mt-2">
                        {formatCouponValue(coupon)} OFF
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openCouponModal(coupon)}
                        className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="編集"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(coupon.id, coupon.name)}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="削除"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Coupon Modal */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsCouponModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium">
                    {editingCoupon ? 'クーポンを編集' : 'クーポンを追加'}
                  </h2>
                  <button
                    onClick={() => setIsCouponModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCouponSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        クーポンコード <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={couponForm.code}
                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)] font-mono"
                        placeholder="WELCOME10"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        クーポン名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={couponForm.name}
                        onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        placeholder="新規顧客10%OFF"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        割引種別 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={couponForm.type}
                        onChange={(e) => setCouponForm({
                          ...couponForm,
                          type: e.target.value as 'PERCENTAGE' | 'FIXED',
                          value: 0
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                        required
                      >
                        <option value="PERCENTAGE">%割引</option>
                        <option value="FIXED">固定額割引</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        割引値 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={couponForm.value}
                          onChange={(e) => setCouponForm({ ...couponForm, value: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                          min="0"
                          max={couponForm.type === 'PERCENTAGE' ? 100 : undefined}
                          step="1"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                          {couponForm.type === 'PERCENTAGE' ? '%' : '円'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        有効開始日 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={couponForm.validFrom}
                        onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        有効終了日 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={couponForm.validUntil}
                        onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        利用上限（全体）
                      </label>
                      <input
                        type="number"
                        value={couponForm.usageLimit ?? ''}
                        onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        min="1"
                        placeholder="無制限"
                      />
                      <p className="text-xs text-gray-500 mt-1">空欄で無制限</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        顧客ごとの上限
                      </label>
                      <input
                        type="number"
                        value={couponForm.usageLimitPerCustomer ?? ''}
                        onChange={(e) => setCouponForm({ ...couponForm, usageLimitPerCustomer: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        min="1"
                        placeholder="無制限"
                      />
                      <p className="text-xs text-gray-500 mt-1">空欄で無制限</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最低購入金額
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={couponForm.minimumAmount ?? ''}
                        onChange={(e) => setCouponForm({ ...couponForm, minimumAmount: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        min="0"
                        placeholder="条件なし"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                        円
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">空欄で条件なし</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">対象メニューID（カンマ区切り）</label>
                      <input
                        type="text"
                        value={couponForm.applicableMenuIds}
                        onChange={(e) => setCouponForm({ ...couponForm, applicableMenuIds: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        placeholder="menu-cut,menu-color"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">対象カテゴリID/名（カンマ区切り）</label>
                      <input
                        type="text"
                        value={couponForm.applicableCategoryIds}
                        onChange={(e) => setCouponForm({ ...couponForm, applicableCategoryIds: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        placeholder="cut,color,spa"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">対象曜日（0=日〜6=土、カンマ区切り）</label>
                      <input
                        type="text"
                        value={couponForm.applicableWeekdays}
                        onChange={(e) => setCouponForm({ ...couponForm, applicableWeekdays: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        placeholder="0,6"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">利用開始時間</label>
                        <input
                          type="time"
                          value={couponForm.startTime}
                          onChange={(e) => setCouponForm({ ...couponForm, startTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">利用終了時間</label>
                        <input
                          type="time"
                          value={couponForm.endTime}
                          onChange={(e) => setCouponForm({ ...couponForm, endTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={couponForm.onlyFirstTime}
                        onChange={(e) => setCouponForm({ ...couponForm, onlyFirstTime: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      初回来店限定
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={couponForm.onlyReturning}
                        onChange={(e) => setCouponForm({ ...couponForm, onlyReturning: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      リピーター限定
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      説明
                    </label>
                    <textarea
                      value={couponForm.description}
                      onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                      rows={2}
                      placeholder="クーポンの説明を入力してください"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="couponIsActive"
                      checked={couponForm.isActive}
                      onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="couponIsActive" className="text-sm text-gray-700">
                      有効
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCouponModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      {editingCoupon ? '更新' : '作成'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && deletingCoupon && (
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
                  「{deletingCoupon.name}」を削除してもよろしいですか？
                  <br />
                  <span className="text-sm">売上履歴がある場合は無効化されます。</span>
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
