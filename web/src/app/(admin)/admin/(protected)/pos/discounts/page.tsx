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
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface Discount {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deletingDiscount, setDeletingDiscount] = useState<{ id: string; name: string } | null>(null);

  // Form state
  const [discountForm, setDiscountForm] = useState({
    name: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: 0,
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/discounts?includeInactive=true');

      if (!res.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const data = await res.json();
      setDiscounts(data);
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

  // Discount handlers
  const openDiscountModal = (discount?: Discount) => {
    if (discount) {
      setEditingDiscount(discount);
      setDiscountForm({
        name: discount.name,
        type: discount.type,
        value: discount.value,
        description: discount.description || '',
        displayOrder: discount.displayOrder,
        isActive: discount.isActive,
      });
    } else {
      setEditingDiscount(null);
      setDiscountForm({
        name: '',
        type: 'PERCENTAGE',
        value: 0,
        description: '',
        displayOrder: discounts.length,
        isActive: true,
      });
    }
    setIsDiscountModalOpen(true);
  };

  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDiscount
        ? `/api/admin/discounts/${editingDiscount.id}`
        : '/api/admin/discounts';
      const method = editingDiscount ? 'PUT' : 'POST';

      const submitData = {
        name: discountForm.name,
        type: discountForm.type,
        value: discountForm.value,
        description: discountForm.description || undefined,
        displayOrder: discountForm.displayOrder,
        isActive: discountForm.isActive,
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

      setIsDiscountModalOpen(false);
      fetchDiscounts();
      showSuccess(editingDiscount ? '割引を更新しました' : '割引を作成しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // Delete handlers
  const openDeleteModal = (id: string, name: string) => {
    setDeletingDiscount({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingDiscount) return;

    try {
      const res = await fetch(`/api/admin/discounts/${deletingDiscount.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      setIsDeleteModalOpen(false);
      setDeletingDiscount(null);
      fetchDiscounts();
      showSuccess('割引を削除しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  const formatDiscountValue = (discount: Discount) => {
    if (discount.type === 'PERCENTAGE') {
      return `${discount.value}%`;
    } else {
      return `¥${discount.value.toLocaleString()}`;
    }
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
            <h1 className="text-2xl font-medium">割引管理</h1>
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
            onClick={() => openDiscountModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            割引を追加
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
          ) : discounts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              割引がありません
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {discounts.map((discount) => (
                <div
                  key={discount.id}
                  className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                    !discount.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      discount.type === 'PERCENTAGE'
                        ? 'bg-blue-100'
                        : 'bg-green-100'
                    }`}>
                      {discount.type === 'PERCENTAGE' ? (
                        <Percent className={`w-5 h-5 ${
                          discount.type === 'PERCENTAGE'
                            ? 'text-blue-600'
                            : 'text-green-600'
                        }`} />
                      ) : (
                        <DollarSign className="w-5 h-5 text-green-600" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium">{discount.name}</p>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          discount.type === 'PERCENTAGE'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {discount.type === 'PERCENTAGE' ? 'パーセンテージ割引' : '固定額割引'}
                        </span>
                        {!discount.isActive && (
                          <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                            無効
                          </span>
                        )}
                      </div>
                      {discount.description && (
                        <p className="text-sm text-gray-500 mb-2">{discount.description}</p>
                      )}
                      <p className="text-lg text-[var(--color-gold)] font-medium">
                        {formatDiscountValue(discount)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openDiscountModal(discount)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="編集"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(discount.id, discount.name)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Discount Modal */}
      <AnimatePresence>
        {isDiscountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsDiscountModalOpen(false)}
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
                    {editingDiscount ? '割引を編集' : '割引を追加'}
                  </h2>
                  <button
                    onClick={() => setIsDiscountModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleDiscountSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      割引名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={discountForm.name}
                      onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                      placeholder="例: 学割"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      割引種別 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={discountForm.type}
                      onChange={(e) => setDiscountForm({
                        ...discountForm,
                        type: e.target.value as 'PERCENTAGE' | 'FIXED',
                        value: 0 // 種別変更時に値をリセット
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                      required
                    >
                      <option value="PERCENTAGE">パーセンテージ割引（%）</option>
                      <option value="FIXED">固定額割引（円）</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      割引値 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={discountForm.value}
                        onChange={(e) => setDiscountForm({ ...discountForm, value: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        min="0"
                        max={discountForm.type === 'PERCENTAGE' ? 100 : undefined}
                        step="1"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                        {discountForm.type === 'PERCENTAGE' ? '%' : '円'}
                      </span>
                    </div>
                    {discountForm.type === 'PERCENTAGE' && (
                      <p className="text-xs text-gray-500 mt-1">
                        ※ 0〜100の範囲で指定してください
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      説明
                    </label>
                    <textarea
                      value={discountForm.description}
                      onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                      rows={3}
                      placeholder="割引の説明を入力してください"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      表示順
                    </label>
                    <input
                      type="number"
                      value={discountForm.displayOrder}
                      onChange={(e) => setDiscountForm({ ...discountForm, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                      min="0"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="discountIsActive"
                      checked={discountForm.isActive}
                      onChange={(e) => setDiscountForm({ ...discountForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="discountIsActive" className="text-sm text-gray-700">
                      有効
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsDiscountModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      {editingDiscount ? '更新' : '作成'}
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
        {isDeleteModalOpen && deletingDiscount && (
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
                  「{deletingDiscount.name}」を削除してもよろしいですか？
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
