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
  Clock,
  Check,
  AlertTriangle,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// プリセットカラー（20色）
const PRESET_COLORS = [
  { color: '#8B7355', name: 'ブラウン' },
  { color: '#9F86C0', name: 'パープル' },
  { color: '#E0B1CB', name: 'ピンク' },
  { color: '#F4A261', name: 'オレンジ' },
  { color: '#98C1D9', name: 'ブルー' },
  { color: '#2A9D8F', name: 'ティール' },
  { color: '#ADB5BD', name: 'グレー' },
  { color: '#E63946', name: 'レッド' },
  { color: '#457B9D', name: 'ネイビー' },
  { color: '#6B705C', name: 'オリーブ' },
  { color: '#CB997E', name: 'ベージュ' },
  { color: '#7209B7', name: 'バイオレット' },
  { color: '#264653', name: 'ダークティール' },
  { color: '#E9C46A', name: 'イエロー' },
  { color: '#3D5A80', name: 'スレートブルー' },
  { color: '#BC6C25', name: 'キャラメル' },
  { color: '#606C38', name: 'モスグリーン' },
  { color: '#780000', name: 'ワインレッド' },
  { color: '#D4A373', name: 'サンド' },
  { color: '#4A4E69', name: 'スチールグレー' },
];

interface Category {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
  menuCount?: number;
}

interface Menu {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  duration: number;
  lastBookingTime: string;
  displayOrder: number;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    nameEn: string;
    color: string;
  };
}

type TabType = 'categories' | 'menus';

export default function AdminMenusPage() {
  const [activeTab, setActiveTab] = useState<TabType>('menus');
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: 'category' | 'menu'; id: string; name: string } | null>(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    nameEn: '',
    color: '#8B7355',
    displayOrder: 0,
    isActive: true,
  });

  const [menuForm, setMenuForm] = useState({
    name: '',
    categoryId: '',
    price: 0,
    duration: 60,
    lastBookingTime: '19:00',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catRes, menuRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/menus?includeInactive=true'),
      ]);

      if (!catRes.ok || !menuRes.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const [catData, menuData] = await Promise.all([
        catRes.json(),
        menuRes.json(),
      ]);

      setCategories(catData);
      setMenus(menuData);
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

  // 使用されていないプリセットカラーを取得
  const getAvailableColor = () => {
    const usedColors = categories.map(c => c.color.toUpperCase());
    const availableColor = PRESET_COLORS.find(
      p => !usedColors.includes(p.color.toUpperCase())
    );
    return availableColor?.color || PRESET_COLORS[0].color;
  };

  // Category handlers
  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        nameEn: category.nameEn,
        color: category.color,
        displayOrder: category.displayOrder,
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        nameEn: '',
        color: getAvailableColor(),
        displayOrder: categories.length,
        isActive: true,
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      setIsCategoryModalOpen(false);
      fetchData();
      showSuccess(editingCategory ? 'カテゴリを更新しました' : 'カテゴリを作成しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // Menu handlers
  const openMenuModal = (menu?: Menu) => {
    if (menu) {
      setEditingMenu(menu);
      setMenuForm({
        name: menu.name,
        categoryId: menu.categoryId,
        price: menu.price,
        duration: menu.duration,
        lastBookingTime: menu.lastBookingTime,
        displayOrder: menu.displayOrder,
        isActive: menu.isActive,
      });
    } else {
      setEditingMenu(null);
      setMenuForm({
        name: '',
        categoryId: categories[0]?.id || '',
        price: 0,
        duration: 60,
        lastBookingTime: '19:00',
        displayOrder: menus.length,
        isActive: true,
      });
    }
    setIsMenuModalOpen(true);
  };

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMenu
        ? `/api/admin/menus/${editingMenu.id}`
        : '/api/admin/menus';
      const method = editingMenu ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      setIsMenuModalOpen(false);
      fetchData();
      showSuccess(editingMenu ? 'メニューを更新しました' : 'メニューを作成しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // Delete handlers
  const openDeleteModal = (type: 'category' | 'menu', id: string, name: string) => {
    setDeletingItem({ type, id, name });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      const url = deletingItem.type === 'category'
        ? `/api/admin/categories/${deletingItem.id}`
        : `/api/admin/menus/${deletingItem.id}`;

      const res = await fetch(url, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      setIsDeleteModalOpen(false);
      setDeletingItem(null);
      fetchData();
      showSuccess(`${deletingItem.type === 'category' ? 'カテゴリ' : 'メニュー'}を削除しました`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

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
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-4 px-3 py-2 -ml-3 min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            ダッシュボードに戻る
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">メニュー管理</h1>
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

        {/* Tabs */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white rounded-lg shadow-sm mb-6"
        >
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('menus')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'menus'
                  ? 'text-[var(--color-charcoal)] border-b-2 border-[var(--color-charcoal)]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              メニュー ({menus.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'text-[var(--color-charcoal)] border-b-2 border-[var(--color-charcoal)]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              カテゴリ ({categories.length})
            </button>
          </div>
        </motion.div>

        {/* Add Button */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-6"
        >
          <button
            onClick={() => activeTab === 'categories' ? openCategoryModal() : openMenuModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'categories' ? 'カテゴリを追加' : 'メニューを追加'}
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
          ) : activeTab === 'categories' ? (
            /* Categories Tab */
            categories.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                カテゴリがありません
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                      !category.isActive ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Color indicator */}
                      <div
                        className="w-10 h-10 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{category.name}</p>
                          <span className="text-sm text-gray-400">({category.nameEn})</span>
                          {!category.isActive && (
                            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                              無効
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {category.menuCount || 0}メニュー
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openCategoryModal(category)}
                          className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="編集"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal('category', category.id, category.name)}
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
            )
          ) : (
            /* Menus Tab - Grouped by Category */
            menus.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                メニューがありません
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {categories.map((category) => {
                  const categoryMenus = menus.filter(m => m.categoryId === category.id);
                  if (categoryMenus.length === 0) return null;

                  return (
                    <div key={category.id}>
                      {/* Category Header */}
                      <div
                        className="px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 bg-gray-50 z-10"
                        style={{ borderLeft: `4px solid ${category.color}` }}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium text-gray-700">{category.name}</span>
                        <span className="text-sm text-gray-400">({categoryMenus.length})</span>
                      </div>

                      {/* Menus in this category */}
                      <div className="divide-y divide-gray-100">
                        {categoryMenus.map((menu) => (
                          <div
                            key={menu.id}
                            className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                              !menu.isActive ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="font-medium">{menu.name}</p>
                                  {!menu.isActive && (
                                    <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                      無効
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {menu.duration}分
                                  </span>
                                </div>
                              </div>

                              {/* Price */}
                              <div className="text-right flex-shrink-0">
                                <p className="text-lg text-[var(--color-gold)]">
                                  {formatPrice(menu.price)}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => openMenuModal(menu)}
                                  className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                  title="編集"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal('menu', menu.id, menu.name)}
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
                    </div>
                  );
                })}
              </div>
            )
          )}
        </motion.div>
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsCategoryModalOpen(false)}
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
                    {editingCategory ? 'カテゴリを編集' : 'カテゴリを追加'}
                  </h2>
                  <button
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カテゴリ名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                      placeholder="例: カット"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      英語名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={categoryForm.nameEn}
                      onChange={(e) => setCategoryForm({ ...categoryForm, nameEn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                      placeholder="例: Cut"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      カラー <span className="text-red-500">*</span>
                    </label>
                    {(() => {
                      const usedColors = categories
                        .filter(c => c.id !== editingCategory?.id)
                        .map(c => c.color.toUpperCase());
                      const availableCount = PRESET_COLORS.filter(
                        p => !usedColors.includes(p.color.toUpperCase())
                      ).length;
                      const isCustomColor = !PRESET_COLORS.some(
                        p => p.color.toUpperCase() === categoryForm.color.toUpperCase()
                      );

                      return (
                        <>
                          <div className="grid grid-cols-5 gap-2 mb-3">
                            {PRESET_COLORS.map((preset) => {
                              const isUsed = usedColors.includes(preset.color.toUpperCase());
                              const isSelected = categoryForm.color.toUpperCase() === preset.color.toUpperCase();

                              return (
                                <button
                                  key={preset.color}
                                  type="button"
                                  onClick={() => !isUsed && setCategoryForm({ ...categoryForm, color: preset.color })}
                                  disabled={isUsed}
                                  className={`
                                    relative w-9 h-9 rounded-lg transition-all
                                    ${isSelected ? 'ring-2 ring-offset-2 ring-[var(--color-charcoal)] scale-110' : ''}
                                    ${isUsed ? 'opacity-20 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                                  `}
                                  style={{ backgroundColor: preset.color }}
                                  title={isUsed ? `${preset.name}（使用中）` : preset.name}
                                >
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-md" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* 残り利用可能数の表示 */}
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: categoryForm.color }}
                              />
                              <span>選択中: {categoryForm.color}</span>
                            </div>
                            <span>利用可能: {availableCount}色</span>
                          </div>

                          {/* カスタムカラー入力（プリセットが足りない場合 or カスタムカラーを使用中の場合） */}
                          {(availableCount === 0 || isCustomColor) && (
                            <div className="pt-2 border-t border-gray-100">
                              <label className="block text-xs text-gray-500 mb-1">
                                カスタムカラー
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={categoryForm.color}
                                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                                  className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200"
                                />
                                <input
                                  type="text"
                                  value={categoryForm.color}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                      setCategoryForm({ ...categoryForm, color: val });
                                    }
                                  }}
                                  className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                                  placeholder="#000000"
                                />
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      表示順
                    </label>
                    <input
                      type="number"
                      value={categoryForm.displayOrder}
                      onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                      min="0"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="categoryIsActive"
                      checked={categoryForm.isActive}
                      onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="categoryIsActive" className="text-sm text-gray-700">
                      有効
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      {editingCategory ? '更新' : '作成'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Menu Modal */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMenuModalOpen(false)}
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
                    {editingMenu ? 'メニューを編集' : 'メニューを追加'}
                  </h2>
                  <button
                    onClick={() => setIsMenuModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleMenuSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メニュー名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={menuForm.name}
                      onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                      placeholder="例: カット"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カテゴリ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={menuForm.categoryId}
                      onChange={(e) => setMenuForm({ ...menuForm, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                      required
                    >
                      <option value="">選択してください</option>
                      {categories.filter(c => c.isActive).map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        価格（税込）<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={menuForm.price}
                        onChange={(e) => setMenuForm({ ...menuForm, price: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        min="0"
                        step="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        所要時間（分）<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={menuForm.duration}
                        onChange={(e) => setMenuForm({ ...menuForm, duration: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        min="10"
                        step="10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      表示順
                    </label>
                    <input
                      type="number"
                      value={menuForm.displayOrder}
                      onChange={(e) => setMenuForm({ ...menuForm, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                      min="0"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="menuIsActive"
                      checked={menuForm.isActive}
                      onChange={(e) => setMenuForm({ ...menuForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="menuIsActive" className="text-sm text-gray-700">
                      有効
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsMenuModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      {editingMenu ? '更新' : '作成'}
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
        {isDeleteModalOpen && deletingItem && (
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
                  「{deletingItem.name}」を削除してもよろしいですか？
                  {deletingItem.type === 'category' && (
                    <span className="block mt-2 text-sm text-red-500">
                      ※ このカテゴリに属するメニューがある場合は削除できません
                    </span>
                  )}
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
