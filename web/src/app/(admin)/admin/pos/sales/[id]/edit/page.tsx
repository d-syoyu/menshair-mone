'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  Check,
  Clock,
  Package,
  Menu as MenuIcon,
  Plus,
  Trash2,
  ChevronDown,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface SaleItem {
  id?: string;
  itemType: 'MENU' | 'PRODUCT';
  menuId?: string;
  menuName?: string;
  category?: string;
  duration?: number;
  productId?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Payment {
  id?: string;
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
  items: SaleItem[];
  payments: Payment[];
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

interface Menu {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  duration: number;
  displayOrder: number;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    color: string;
  };
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  stock: number | null;
  displayOrder: number;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  };
}

interface ProductCategory {
  id: string;
  name: string;
}

interface Discount {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  isActive: boolean;
}

interface PaymentMethodSetting {
  id: string;
  code: string;
  displayName: string;
  isActive: boolean;
  displayOrder: number;
}

export default function EditSalePage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [menus, setMenus] = useState<Menu[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [taxRate, setTaxRate] = useState(10);

  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [expandedMenuCategories, setExpandedMenuCategories] = useState<string[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [customDiscountAmount, setCustomDiscountAmount] = useState<number>(0);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSetting[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchSale();
    fetchMenus();
    fetchProducts();
    fetchProductCategories();
    fetchDiscounts();
    fetchTaxRate();
    fetchPaymentMethods();
  }, [saleId]);

  useEffect(() => {
    // Initialize form state from sale data
    // menusが読み込まれるまで待機
    if (sale && menus.length > 0) {
      // Set selected menus
      const menuIds: string[] = [];
      sale.items
        .filter(item => item.itemType === 'MENU')
        .forEach(item => {
          if (item.menuId) {
            // menuIdがある場合はそのまま使用
            menuIds.push(item.menuId);
          } else if (item.menuName) {
            // menuIdがない場合はmenuNameで検索（フォールバック）
            const foundMenu = menus.find(m => m.name === item.menuName);
            if (foundMenu) {
              menuIds.push(foundMenu.id);
            }
          }
        });
      setSelectedMenuIds(menuIds);

      // Set product quantities
      const quantities: Record<string, number> = {};
      sale.items
        .filter(item => item.itemType === 'PRODUCT')
        .forEach(item => {
          if (item.productId) {
            quantities[item.productId] = item.quantity;
          } else if (item.productName && products.length > 0) {
            // productIdがない場合はproductNameで検索（フォールバック）
            const foundProduct = products.find(p => p.name === item.productName);
            if (foundProduct) {
              quantities[foundProduct.id] = item.quantity;
            }
          }
        });
      setProductQuantities(quantities);

      // Set discount
      setCustomDiscountAmount(sale.discountAmount);

      // Set payments
      setPayments(sale.payments.map(p => ({
        paymentMethod: p.paymentMethod,
        amount: p.amount,
      })));

      // Set note
      setNote(sale.note || '');

      // Set tax rate
      setTaxRate(sale.taxRate);
    }
  }, [sale, menus, products]);

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

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/admin/menus');
      const data = await res.json();
      setMenus(data);
    } catch (err) {
      console.error('Failed to fetch menus:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchProductCategories = async () => {
    try {
      const res = await fetch('/api/admin/product-categories');
      const data = await res.json();
      setProductCategories(data);
    } catch (err) {
      console.error('Failed to fetch product categories:', err);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const res = await fetch('/api/admin/discounts');
      const data = await res.json();
      setDiscounts(data);
    } catch (err) {
      console.error('Failed to fetch discounts:', err);
    }
  };

  const fetchTaxRate = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      setTaxRate(parseInt(data.tax_rate || '10'));
    } catch (err) {
      console.error('Failed to fetch tax rate:', err);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch('/api/admin/payment-methods');
      const data = await res.json();
      // 有効な支払方法のみをフィルタリング
      const methods = data.paymentMethods || data;
      const activeMethods = methods.filter((pm: PaymentMethodSetting) => pm.isActive);
      setPaymentMethods(activeMethods);
    } catch (err) {
      console.error('Failed to fetch payment methods:', err);
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

  const calculateSubtotal = () => {
    let subtotal = 0;

    // Menu subtotal
    selectedMenuIds.forEach((menuId) => {
      const menu = menus.find((m) => m.id === menuId);
      if (menu) subtotal += menu.price;
    });

    // Product subtotal
    Object.entries(productQuantities).forEach(([productId, quantity]) => {
      const product = products.find((p) => p.id === productId);
      if (product && quantity > 0) {
        subtotal += product.price * quantity;
      }
    });

    return subtotal;
  };

  const getDiscountAmount = () => {
    if (selectedDiscount) {
      const subtotal = calculateSubtotal();
      if (selectedDiscount.type === 'PERCENTAGE') {
        return Math.floor((subtotal * selectedDiscount.value) / 100);
      } else {
        return selectedDiscount.value;
      }
    }
    return customDiscountAmount;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discount = getDiscountAmount();
    const taxableAmount = Math.max(0, subtotal - discount);
    return Math.floor(taxableAmount * (taxRate / 100));
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = getDiscountAmount();
    const tax = calculateTax();
    return subtotal - discount + tax;
  };

  const handleAddPayment = () => {
    const defaultMethod = paymentMethods.length > 0 ? paymentMethods[0].code : 'CASH';
    setPayments([...payments, { paymentMethod: defaultMethod, amount: 0 }]);
  };

  const handleRemovePayment = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (selectedMenuIds.length === 0 && Object.keys(productQuantities).filter(k => productQuantities[k] > 0).length === 0) {
      showError('メニューまたは商品を選択してください');
      return;
    }

    const total = calculateTotal();
    const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0);

    if (paymentTotal !== total) {
      showError(`支払総額が合計金額と一致しません（支払: ¥${paymentTotal.toLocaleString()}, 合計: ¥${total.toLocaleString()}）`);
      return;
    }

    if (payments.some((p) => p.amount <= 0)) {
      showError('支払金額は1円以上を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build items
      const items: SaleItem[] = [];

      // Menu items
      selectedMenuIds.forEach((menuId) => {
        const menu = menus.find((m) => m.id === menuId);
        if (menu) {
          items.push({
            itemType: 'MENU',
            menuId: menu.id,
            menuName: menu.name,
            category: menu.category.name,
            duration: menu.duration,
            quantity: 1,
            unitPrice: menu.price,
            subtotal: menu.price,
          });
        }
      });

      // Product items
      Object.entries(productQuantities).forEach(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        if (product && quantity > 0) {
          items.push({
            itemType: 'PRODUCT',
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice: product.price,
            subtotal: product.price * quantity,
          });
        }
      });

      const requestBody = {
        items,
        payments,
        discountAmount: getDiscountAmount(),
        note: note || undefined,
      };

      const res = await fetch(`/api/admin/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || '会計の更新に失敗しました');
        return;
      }

      // Success - redirect to detail page
      router.push(`/admin/pos/sales/${saleId}`);
    } catch (err) {
      showError('会計の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
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
            href={`/admin/pos/sales/${saleId}`}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            会計詳細に戻る
          </Link>
          <h1 className="text-2xl font-medium mb-2">会計編集</h1>
          <p className="text-gray-600">
            {sale.saleNumber} - {formatDate(sale.saleDate)} {sale.saleTime}
          </p>
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

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="space-y-6"
        >
          {/* Customer Info (Read-only) */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">顧客情報</h2>
            <div className="text-gray-600">
              <p className="font-medium">{sale.customerName || '名前未登録'}</p>
              {sale.customerPhone && <p className="text-sm">{sale.customerPhone}</p>}
            </div>
          </div>

          {/* Menu Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <MenuIcon className="w-5 h-5 text-[var(--color-gold)]" />
              施術メニュー
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {/* カテゴリーごとにアコーディオン */}
              {(() => {
                // カテゴリーをユニークに取得
                const categories = Array.from(
                  new Map(menus.map((m) => [m.category.id, m.category])).values()
                );

                return categories.map((category) => {
                  const categoryMenus = menus
                    .filter((m) => m.categoryId === category.id)
                    .sort((a, b) => a.displayOrder - b.displayOrder);

                  if (categoryMenus.length === 0) return null;

                  const isExpanded = expandedMenuCategories.includes(category.id);
                  const selectedCount = categoryMenus.filter((m) =>
                    selectedMenuIds.includes(m.id)
                  ).length;

                  return (
                    <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* カテゴリーヘッダー（クリックで展開/折りたたみ） */}
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedMenuCategories((prev) =>
                            prev.includes(category.id)
                              ? prev.filter((id) => id !== category.id)
                              : [...prev, category.id]
                          );
                        }}
                        className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 transition-colors"
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="flex-1 text-left font-medium text-gray-700">
                          {category.name}
                        </span>
                        {selectedCount > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-[var(--color-gold)] text-white rounded-full">
                            {selectedCount}
                          </span>
                        )}
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* メニューリスト（展開時のみ表示） */}
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
                              {categoryMenus.map((menu) => (
                                <label
                                  key={menu.id}
                                  className="flex items-center gap-3 p-2 bg-white border border-gray-100 rounded-lg hover:border-gray-200 cursor-pointer transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedMenuIds.includes(menu.id)}
                                    onChange={() => {
                                      setSelectedMenuIds((prev) =>
                                        prev.includes(menu.id)
                                          ? prev.filter((id) => id !== menu.id)
                                          : [...prev, menu.id]
                                      );
                                    }}
                                    className="w-4 h-4 rounded border-gray-300"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{menu.name}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {menu.duration}分
                                    </p>
                                  </div>
                                  <p className="text-[var(--color-gold)] font-medium text-sm flex-shrink-0">
                                    {formatPrice(menu.price)}
                                  </p>
                                </label>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Product Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-[var(--color-gold)]" />
              店販商品
            </h2>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {productCategories.map((category) => {
                const categoryProducts = products
                  .filter((p) => p.categoryId === category.id)
                  .sort((a, b) => a.displayOrder - b.displayOrder);

                if (categoryProducts.length === 0) return null;

                return (
                  <div key={category.id}>
                    <p className="text-sm font-medium text-gray-600 mb-2">{category.name}</p>
                    <div className="space-y-2">
                      {categoryProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            {product.stock !== null && (
                              <p className="text-xs text-gray-500">在庫: {product.stock}</p>
                            )}
                          </div>
                          <p className="text-[var(--color-gold)] font-medium">
                            {formatPrice(product.price)}
                          </p>
                          <input
                            type="number"
                            min="0"
                            value={productQuantities[product.id] || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setProductQuantities((prev) => ({
                                ...prev,
                                [product.id]: value,
                              }));
                            }}
                            className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-[var(--color-accent)]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Discount */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">割引</h2>
            <div className="space-y-2 mb-3">
              <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  checked={!selectedDiscount && customDiscountAmount === 0}
                  onChange={() => {
                    setSelectedDiscount(null);
                    setCustomDiscountAmount(0);
                  }}
                  className="w-4 h-4"
                />
                <span>割引なし</span>
              </label>
              {discounts.map((discount) => (
                <label
                  key={discount.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={selectedDiscount?.id === discount.id}
                      onChange={() => {
                        setSelectedDiscount(discount);
                        setCustomDiscountAmount(0);
                      }}
                      className="w-4 h-4"
                    />
                    <span>{discount.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {discount.type === 'PERCENTAGE'
                      ? `${discount.value}%`
                      : formatPrice(discount.value)}
                  </span>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カスタム割引額（円）
              </label>
              <input
                type="number"
                min="0"
                value={customDiscountAmount}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setCustomDiscountAmount(value);
                  if (value > 0) setSelectedDiscount(null);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="0"
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">支払方法</h2>
            <div className="space-y-3">
              {payments.map((payment, index) => (
                <div key={index} className="flex items-center gap-3">
                  <select
                    value={payment.paymentMethod}
                    onChange={(e) => {
                      const newPayments = [...payments];
                      newPayments[index].paymentMethod = e.target.value;
                      setPayments(newPayments);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.code} value={method.code}>
                        {method.displayName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={payment.amount}
                    onChange={(e) => {
                      const newPayments = [...payments];
                      newPayments[index].amount = parseInt(e.target.value) || 0;
                      setPayments(newPayments);
                    }}
                    className="w-32 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-right focus:outline-none focus:border-[var(--color-accent)]"
                    placeholder="0"
                  />
                  {payments.length > 1 && (
                    <button
                      onClick={() => handleRemovePayment(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleAddPayment}
              className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              支払方法を追加
            </button>
          </div>

          {/* Note */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">備考</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
              rows={3}
              placeholder="メモを入力してください"
            />
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">合計金額</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">小計</span>
                <span>{formatPrice(calculateSubtotal())}</span>
              </div>
              {getDiscountAmount() > 0 && (
                <div className="flex items-center justify-between text-sm text-red-600">
                  <span>割引</span>
                  <span>-{formatPrice(getDiscountAmount())}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">消費税（{taxRate}%）</span>
                <span>{formatPrice(calculateTax())}</span>
              </div>
              <div className="flex items-center justify-between text-xl font-medium pt-2 border-t border-gray-200">
                <span>合計金額</span>
                <span className="text-[var(--color-gold)]">{formatPrice(calculateTotal())}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-gray-600">支払合計</span>
                <span className={payments.reduce((sum, p) => sum + p.amount, 0) === calculateTotal() ? 'text-green-600' : 'text-red-600'}>
                  {formatPrice(payments.reduce((sum, p) => sum + p.amount, 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <Link
              href={`/admin/pos/sales/${saleId}`}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              キャンセル
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2 bg-[var(--color-charcoal)] text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '保存中...' : '変更を保存'}
              <Save className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
