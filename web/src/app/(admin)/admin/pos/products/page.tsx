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
  Package,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface ProductCategory {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  productCount?: number;
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  cost: number | null;
  stock: number | null;
  code: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  };
}

type TabType = 'products' | 'categories';

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: 'category' | 'product'; id: string; name: string } | null>(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    displayOrder: 0,
    isActive: true,
  });

  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: '',
    price: 0,
    cost: '',
    stock: '',
    code: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/admin/product-categories'),
        fetch('/api/admin/products?includeInactive=true'),
      ]);

      if (!catRes.ok || !prodRes.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const [catData, prodData] = await Promise.all([
        catRes.json(),
        prodRes.json(),
      ]);

      setCategories(catData);
      setProducts(prodData);
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

  // Category handlers
  const openCategoryModal = (category?: ProductCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        displayOrder: category.displayOrder,
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
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
        ? `/api/admin/product-categories/${editingCategory.id}`
        : '/api/admin/product-categories';
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

  // Product handlers
  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        categoryId: product.categoryId,
        price: product.price,
        cost: product.cost !== null ? String(product.cost) : '',
        stock: product.stock !== null ? String(product.stock) : '',
        code: product.code || '',
        description: product.description || '',
        displayOrder: product.displayOrder,
        isActive: product.isActive,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        categoryId: categories[0]?.id || '',
        price: 0,
        cost: '',
        stock: '',
        code: '',
        description: '',
        displayOrder: products.length,
        isActive: true,
      });
    }
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      // フォームデータを整形
      const submitData = {
        name: productForm.name,
        categoryId: productForm.categoryId,
        price: productForm.price,
        cost: productForm.cost ? parseInt(productForm.cost) : undefined,
        stock: productForm.stock ? parseInt(productForm.stock) : undefined,
        code: productForm.code || undefined,
        description: productForm.description || undefined,
        displayOrder: productForm.displayOrder,
        isActive: productForm.isActive,
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

      setIsProductModalOpen(false);
      fetchData();
      showSuccess(editingProduct ? '商品を更新しました' : '商品を作成しました');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // Delete handlers
  const openDeleteModal = (type: 'category' | 'product', id: string, name: string) => {
    setDeletingItem({ type, id, name });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      const url = deletingItem.type === 'category'
        ? `/api/admin/product-categories/${deletingItem.id}`
        : `/api/admin/products/${deletingItem.id}`;

      const res = await fetch(url, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'エラーが発生しました');
      }

      setIsDeleteModalOpen(false);
      setDeletingItem(null);
      fetchData();
      showSuccess(`${deletingItem.type === 'category' ? 'カテゴリ' : '商品'}を削除しました`);
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
            href="/admin/pos"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            POSダッシュボードに戻る
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">店販商品管理</h1>
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
              onClick={() => setActiveTab('products')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'products'
                  ? 'text-[var(--color-charcoal)] border-b-2 border-[var(--color-charcoal)]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              商品 ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'text-[var(--color-charcoal)] border-b-2 border-[var(--color-charcoal)]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              商品カテゴリ ({categories.length})
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
            onClick={() => activeTab === 'categories' ? openCategoryModal() : openProductModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-charcoal)] text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'categories' ? 'カテゴリを追加' : '商品を追加'}
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
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/10 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-[var(--color-gold)]" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{category.name}</p>
                          {!category.isActive && (
                            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                              無効
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {category.productCount || 0}商品
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openCategoryModal(category)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="編集"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal('category', category.id, category.name)}
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
            )
          ) : (
            /* Products Tab - Grouped by Category */
            products.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                商品がありません
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {categories.map((category) => {
                  const categoryProducts = products.filter(p => p.categoryId === category.id);
                  if (categoryProducts.length === 0) return null;

                  return (
                    <div key={category.id}>
                      {/* Category Header */}
                      <div className="px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 bg-gray-50 z-10 border-l-4 border-[var(--color-gold)]">
                        <Package className="w-4 h-4 text-[var(--color-gold)]" />
                        <span className="font-medium text-gray-700">{category.name}</span>
                        <span className="text-sm text-gray-400">({categoryProducts.length})</span>
                      </div>

                      {/* Products in this category */}
                      <div className="divide-y divide-gray-100">
                        {categoryProducts.map((product) => (
                          <div
                            key={product.id}
                            className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                              !product.isActive ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="font-medium">{product.name}</p>
                                  {product.code && (
                                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                      {product.code}
                                    </span>
                                  )}
                                  {!product.isActive && (
                                    <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                      無効
                                    </span>
                                  )}
                                </div>
                                {product.description && (
                                  <p className="text-sm text-gray-500 mb-2">{product.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  {product.stock !== null && (
                                    <span>在庫: {product.stock}</span>
                                  )}
                                  {product.cost !== null && (
                                    <span>原価: {formatPrice(product.cost)}</span>
                                  )}
                                </div>
                              </div>

                              {/* Price */}
                              <div className="text-right flex-shrink-0">
                                <p className="text-lg text-[var(--color-gold)]">
                                  {formatPrice(product.price)}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => openProductModal(product)}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="編集"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal('product', product.id, product.name)}
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
              className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
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
                      placeholder="例: シャンプー"
                      required
                    />
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
                      className="px-4 py-2 bg-[var(--color-charcoal)] text-white rounded-lg hover:bg-gray-700 transition-colors"
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

      {/* Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsProductModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium">
                    {editingProduct ? '商品を編集' : '商品を追加'}
                  </h2>
                  <button
                    onClick={() => setIsProductModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      商品名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                      placeholder="例: オーガニックシャンプー"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カテゴリ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
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
                        販売価格（税込）<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        min="0"
                        step="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        原価（円）
                      </label>
                      <input
                        type="number"
                        value={productForm.cost}
                        onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        min="0"
                        step="1"
                        placeholder="任意"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        在庫数
                      </label>
                      <input
                        type="number"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        min="0"
                        step="1"
                        placeholder="任意"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        商品コード
                      </label>
                      <input
                        type="text"
                        value={productForm.code}
                        onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                        placeholder="例: P001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      説明
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                      rows={3}
                      placeholder="商品の説明を入力してください"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      表示順
                    </label>
                    <input
                      type="number"
                      value={productForm.displayOrder}
                      onChange={(e) => setProductForm({ ...productForm, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                      min="0"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="productIsActive"
                      checked={productForm.isActive}
                      onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="productIsActive" className="text-sm text-gray-700">
                      有効
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsProductModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--color-charcoal)] text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      {editingProduct ? '更新' : '作成'}
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
              className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4"
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
                      ※ このカテゴリに属する商品がある場合は削除できません
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
