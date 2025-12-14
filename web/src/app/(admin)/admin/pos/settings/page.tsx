'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  AlertTriangle,
  Settings as SettingsIcon,
  CreditCard,
  GripVertical,
  Pencil,
  X,
  Save,
  Plus,
  Trash2,
} from 'lucide-react';

// コードから日本語名へのマッピング
const CODE_DISPLAY_NAMES: Record<string, string> = {
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

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface PaymentMethod {
  id: string;
  code: string;
  displayName: string;
  isActive: boolean;
  displayOrder: number;
}

export default function AdminPOSSettingsPage() {
  const [taxRate, setTaxRate] = useState<number>(10);
  const [inputValue, setInputValue] = useState<string>('10');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 支払方法管理
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isPaymentMethodsLoading, setIsPaymentMethodsLoading] = useState(true);
  const [isSavingPaymentMethods, setIsSavingPaymentMethods] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [hasPaymentMethodChanges, setHasPaymentMethodChanges] = useState(false);

  // 追加モーダル
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPaymentCode, setNewPaymentCode] = useState<string>('');
  const [newPaymentName, setNewPaymentName] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  // 削除中
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchPaymentMethods();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings');

      if (!res.ok) {
        throw new Error('設定の取得に失敗しました');
      }

      const data = await res.json();
      const rate = parseInt(data.tax_rate || '10');
      setTaxRate(rate);
      setInputValue(String(rate));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    setIsPaymentMethodsLoading(true);
    try {
      const res = await fetch('/api/admin/payment-methods');
      if (!res.ok) throw new Error('支払方法の取得に失敗しました');
      const data = await res.json();
      setPaymentMethods(data.paymentMethods);
    } catch (err) {
      showError(err instanceof Error ? err.message : '支払方法の取得に失敗しました');
    } finally {
      setIsPaymentMethodsLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const newRate = parseInt(inputValue);

      if (isNaN(newRate) || newRate < 0 || newRate > 100) {
        throw new Error('税率は0〜100の範囲で入力してください');
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tax_rate: newRate }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      setTaxRate(newRate);
      showSuccess('消費税率を更新しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 支払方法の有効/無効切り替え
  const togglePaymentMethodActive = (id: string) => {
    setPaymentMethods(prev =>
      prev.map(pm =>
        pm.id === id ? { ...pm, isActive: !pm.isActive } : pm
      )
    );
    setHasPaymentMethodChanges(true);
  };

  // 支払方法の表示名編集開始
  const startEditingName = (pm: PaymentMethod) => {
    setEditingId(pm.id);
    setEditingName(pm.displayName);
  };

  // 支払方法の表示名保存
  const saveEditingName = () => {
    if (editingId && editingName.trim()) {
      setPaymentMethods(prev =>
        prev.map(pm =>
          pm.id === editingId ? { ...pm, displayName: editingName.trim() } : pm
        )
      );
      setHasPaymentMethodChanges(true);
    }
    setEditingId(null);
    setEditingName('');
  };

  // 並び替え処理
  const handleReorder = (newOrder: PaymentMethod[]) => {
    setPaymentMethods(newOrder.map((pm, index) => ({ ...pm, displayOrder: index })));
    setHasPaymentMethodChanges(true);
  };

  // 支払方法の保存
  const savePaymentMethods = async () => {
    setIsSavingPaymentMethods(true);
    try {
      const res = await fetch('/api/admin/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentMethods.map((pm, index) => ({
          id: pm.id,
          displayName: pm.displayName,
          isActive: pm.isActive,
          displayOrder: index,
        }))),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      const data = await res.json();
      setPaymentMethods(data.paymentMethods);
      setHasPaymentMethodChanges(false);
      showSuccess('支払方法を更新しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : '支払方法の更新に失敗しました');
    } finally {
      setIsSavingPaymentMethods(false);
    }
  };

  // 支払方法の追加
  const addPaymentMethod = async () => {
    if (!newPaymentCode || !newPaymentName.trim()) {
      showError('コードと表示名を入力してください');
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch('/api/admin/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newPaymentCode,
          displayName: newPaymentName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      const data = await res.json();
      setPaymentMethods(data.paymentMethods);
      setIsAddModalOpen(false);
      setNewPaymentCode('');
      setNewPaymentName('');
      showSuccess('支払方法を追加しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : '支払方法の追加に失敗しました');
    } finally {
      setIsAdding(false);
    }
  };

  // 支払方法の削除
  const deletePaymentMethod = async (id: string) => {
    if (!confirm('この支払方法を削除しますか？')) return;

    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      const data = await res.json();
      setPaymentMethods(data.paymentMethods);
      showSuccess('支払方法を削除しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : '支払方法の削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  // 追加モーダルを開く
  const openAddModal = () => {
    setNewPaymentCode('');
    setNewPaymentName('');
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
      <div className="container-wide max-w-3xl mx-auto px-4">
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-charcoal)]/10 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-[var(--color-charcoal)]" />
            </div>
            <h1 className="text-2xl font-medium">POS設定</h1>
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

        {/* Tax Rate Settings Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white rounded-lg shadow-sm p-6 sm:p-8 mb-6"
        >
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">読み込み中...</div>
          ) : (
            <>
              <h2 className="text-lg font-medium mb-6">消費税率設定</h2>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-600">現在の消費税率:</span>
                  <span className="text-3xl font-light text-[var(--color-gold)]">{taxRate}%</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新しい消費税率 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-xs">
                      <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 text-lg placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        min="0"
                        max="100"
                        step="1"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none">
                        %
                      </span>
                    </div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? '更新中...' : '更新'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    ※ 0〜100の範囲で入力してください（例: 10）
                  </p>
                </div>
              </form>
            </>
          )}
        </motion.div>

        {/* Payment Methods Settings Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white rounded-lg shadow-sm p-6 sm:p-8 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-[var(--color-gold)]" />
              <h2 className="text-lg font-medium">支払方法設定</h2>
            </div>
            <div className="flex items-center gap-2">
              {hasPaymentMethodChanges && (
                <button
                  onClick={savePaymentMethods}
                  disabled={isSavingPaymentMethods}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSavingPaymentMethods ? '保存中...' : '変更を保存'}
                </button>
              )}
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                追加
              </button>
            </div>
          </div>

          {isPaymentMethodsLoading ? (
            <div className="py-12 text-center text-gray-500">読み込み中...</div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                ドラッグ&ドロップで並び替え、トグルで有効/無効を切り替えられます。
              </p>

              <Reorder.Group
                axis="y"
                values={paymentMethods}
                onReorder={handleReorder}
                className="space-y-2"
              >
                {paymentMethods.map((pm) => (
                  <Reorder.Item
                    key={pm.id}
                    value={pm}
                    className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                      pm.isActive
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    {/* ドラッグハンドル */}
                    <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* 支払方法名 */}
                    <div className="flex-1 min-w-0">
                      {editingId === pm.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditingName();
                              if (e.key === 'Escape') {
                                setEditingId(null);
                                setEditingName('');
                              }
                            }}
                            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                            autoFocus
                          />
                          <button
                            onClick={saveEditingName}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingName('');
                            }}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${pm.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                            {pm.displayName}
                          </span>
                          <span className="text-xs text-gray-400">({pm.code})</span>
                          <button
                            onClick={() => startEditingName(pm)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 有効/無効トグル */}
                    <button
                      onClick={() => togglePaymentMethodActive(pm.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        pm.isActive ? 'bg-[var(--color-accent)]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          pm.isActive ? 'left-[26px]' : 'left-0.5'
                        }`}
                      />
                    </button>

                    {/* 削除ボタン */}
                    <button
                      onClick={() => deletePaymentMethod(pm.id)}
                      disabled={deletingId === pm.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {hasPaymentMethodChanges && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-yellow-700">
                    <AlertTriangle className="w-4 h-4" />
                    変更があります。保存ボタンを押して確定してください。
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="p-6 bg-white rounded-lg shadow-sm"
        >
          <h3 className="text-base font-medium mb-3">設定について</h3>
          <div className="text-sm text-gray-600 space-y-3">
            <div>
              <p className="font-medium text-gray-700 mb-1">消費税率</p>
              <p>
                会計時に、この設定で指定された消費税率が自動的に適用されます。
                過去の会計データは、会計時点の税率が保存されているため、
                税率変更後も正確な記録が維持されます。
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">支払方法</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>有効な支払方法のみが会計画面に表示されます</li>
                <li>表示順は上から下の順番で表示されます</li>
                <li>表示名は自由にカスタマイズできます</li>
                <li>使用しない支払方法は無効にすることをお勧めします</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 支払方法追加モーダル */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">支払方法を追加</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    支払方法コード <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPaymentCode}
                    onChange={(e) => setNewPaymentCode(e.target.value.toUpperCase())}
                    placeholder="例: AMAZON_PAY"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ※ 大文字英数字とアンダースコアのみ使用できます
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    表示名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPaymentName}
                    onChange={(e) => setNewPaymentName(e.target.value)}
                    placeholder="例: Amazon Pay"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={addPaymentMethod}
                  disabled={isAdding || !newPaymentCode || !newPaymentName.trim()}
                  className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAdding ? (
                    '追加中...'
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      追加
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
