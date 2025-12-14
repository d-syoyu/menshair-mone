'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Check,
  AlertTriangle,
  User,
  Search,
  Calendar,
  Clock,
  Package,
  Menu as MenuIcon,
  Percent,
  DollarSign,
  CreditCard,
  Plus,
  Trash2,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

type Step = 1 | 2 | 3;
type SourceType = 'reservation' | 'walkin' | null;

interface Customer {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
}

interface Reservation {
  id: string;
  date: string;
  startTime: string;
  totalPrice: number;
  totalDuration: number;
  menuSummary: string;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
  };
  items: {
    id: string;
    menuId: string;
    menuName: string;
    category: string;
    price: number;
    duration: number;
  }[];
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

interface SaleItem {
  itemType: 'MENU' | 'PRODUCT';
  menuId?: string;
  menuName?: string;
  category?: string;
  duration?: number;
  productId?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
}

interface Payment {
  paymentMethod: string;
  amount: number;
}

interface PaymentMethodSetting {
  id: string;
  code: string;
  displayName: string;
  isActive: boolean;
  displayOrder: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1: 会計元の選択
  const [sourceType, setSourceType] = useState<SourceType>(null);
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');

  // Step 2: 明細入力
  const [menus, setMenus] = useState<Menu[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [expandedMenuCategories, setExpandedMenuCategories] = useState<string[]>([]);

  // Step 3: 支払・確定
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [customDiscountAmount, setCustomDiscountAmount] = useState<number>(0);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSetting[]>([]);
  const [payments, setPayments] = useState<Payment[]>([
    { paymentMethod: 'CASH', amount: 0 },
  ]);
  const [saleDate, setSaleDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [saleTime, setSaleTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(Math.floor(now.getMinutes() / 10) * 10).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [note, setNote] = useState('');
  const [taxRate, setTaxRate] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (step === 1 && sourceType === 'reservation') {
      fetchTodayReservations();
    } else if (step === 1 && sourceType === 'walkin') {
      fetchCustomers();
    } else if (step === 2) {
      fetchMenus();
      fetchProducts();
      fetchProductCategories();
    } else if (step === 3) {
      fetchDiscounts();
      fetchTaxRate();
      fetchPaymentMethods();
    }
  }, [step, sourceType]);

  // 顧客検索
  useEffect(() => {
    if (customerSearch && sourceType === 'walkin') {
      const timer = setTimeout(() => fetchCustomers(customerSearch), 300);
      return () => clearTimeout(timer);
    }
  }, [customerSearch, sourceType]);

  // 予約からのメニュー自動設定（menusがロードされた後に実行）
  useEffect(() => {
    if (step === 2 && selectedReservation && menus.length > 0 && selectedMenuIds.length === 0) {
      // 予約アイテムのメニュー名でマッチング
      const matchedMenuIds: string[] = [];
      selectedReservation.items.forEach((item) => {
        const matchedMenu = menus.find((m) => m.name === item.menuName);
        if (matchedMenu) {
          matchedMenuIds.push(matchedMenu.id);
        }
      });
      if (matchedMenuIds.length > 0) {
        setSelectedMenuIds(matchedMenuIds);
        // 選択されたメニューのカテゴリを自動展開
        const categoryIds = Array.from(
          new Set(matchedMenuIds.map((id) => menus.find((m) => m.id === id)?.categoryId).filter(Boolean))
        ) as string[];
        setExpandedMenuCategories(categoryIds);
      }
    }
  }, [step, selectedReservation, menus, selectedMenuIds.length]);

  const fetchTodayReservations = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/admin/reservations?date=${today}&status=CONFIRMED`);
      const data = await res.json();
      setTodayReservations(data.reservations || []);
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
    }
  };

  const fetchCustomers = async (query = '') => {
    try {
      const url = query
        ? `/api/admin/customers?q=${encodeURIComponent(query)}`
        : '/api/admin/customers';
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
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
      // 有効な支払方法のみをフィルタリングして設定
      const methods = data.paymentMethods || data;
      const activeMethods = methods.filter((pm: PaymentMethodSetting) => pm.isActive);
      setPaymentMethods(activeMethods);
      // 初期支払方法を最初の有効な支払方法に設定
      if (activeMethods.length > 0 && payments[0].paymentMethod === 'CASH') {
        setPayments([{ paymentMethod: activeMethods[0].code, amount: 0 }]);
      }
    } catch (err) {
      console.error('Failed to fetch payment methods:', err);
    }
  };

  const handleNextStep = () => {
    setError(null);

    if (step === 1) {
      if (!sourceType) {
        setError('会計元を選択してください');
        return;
      }

      if (sourceType === 'reservation' && !selectedReservation) {
        setError('予約を選択してください');
        return;
      }

      if (sourceType === 'walkin' && !selectedCustomer && (!walkinName || !walkinPhone)) {
        setError('顧客を選択するか、顧客情報を入力してください');
        return;
      }

      // 予約から作成の場合、メニューはuseEffectで自動設定される（名前マッチング）
    }

    if (step === 2) {
      if (selectedMenuIds.length === 0 && Object.keys(productQuantities).length === 0) {
        setError('メニューまたは商品を選択してください');
        return;
      }
    }

    setStep((prev) => (prev + 1) as Step);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep((prev) => (prev - 1) as Step);
  };

  const calculateSubtotal = () => {
    let subtotal = 0;

    // メニューの小計
    selectedMenuIds.forEach((menuId) => {
      const menu = menus.find((m) => m.id === menuId);
      if (menu) subtotal += menu.price;
    });

    // 商品の小計
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

    // バリデーション
    const total = calculateTotal();
    const paymentTotal = payments.reduce((sum, p) => sum + p.amount, 0);

    if (paymentTotal !== total) {
      setError(`支払総額が合計金額と一致しません（支払: ¥${paymentTotal.toLocaleString()}, 合計: ¥${total.toLocaleString()}）`);
      return;
    }

    if (payments.some((p) => p.amount <= 0)) {
      setError('支払金額は1円以上を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      // 会計明細を作成
      const items: SaleItem[] = [];

      // メニュー明細
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
          });
        }
      });

      // 商品明細
      Object.entries(productQuantities).forEach(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        if (product && quantity > 0) {
          items.push({
            itemType: 'PRODUCT',
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice: product.price,
          });
        }
      });

      const requestBody = {
        userId: sourceType === 'reservation' ? selectedReservation?.user.id : selectedCustomer?.id,
        customerName: sourceType === 'reservation'
          ? selectedReservation?.user.name
          : selectedCustomer?.name || walkinName,
        customerPhone: sourceType === 'reservation'
          ? selectedReservation?.user.phone
          : selectedCustomer?.phone || walkinPhone,
        reservationId: sourceType === 'reservation' ? selectedReservation?.id : undefined,
        items,
        payments,
        discountAmount: getDiscountAmount(),
        note: note || undefined,
        saleDate,
        saleTime,
      };

      const res = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '会計の作成に失敗しました');
        return;
      }

      // 成功したら会計履歴ページに遷移
      router.push('/admin/pos/sales');
    } catch (err) {
      setError('会計の作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

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
            href="/admin/pos"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            POSダッシュボードに戻る
          </Link>
          <h1 className="text-2xl font-medium">新規会計登録</h1>
        </motion.div>

        {/* Step Indicator */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <div className="flex items-start justify-center max-w-2xl mx-auto">
            {[
              { num: 1, label: '会計元選択' },
              { num: 2, label: '明細入力' },
              { num: 3, label: '支払・確定' }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                      step >= s.num
                        ? 'bg-[var(--color-charcoal)] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={`mt-2 text-xs sm:text-sm text-center ${
                    step === s.num ? 'font-medium text-[var(--color-charcoal)]' : 'text-gray-600'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`h-1 flex-1 -mt-5 transition-colors ${
                      step > s.num ? 'bg-[var(--color-charcoal)]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
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

        {/* Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white rounded-lg shadow-sm p-6 sm:p-8"
        >
          {/* Step 1: 会計元の選択 */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium mb-4">会計元を選択</h2>

              {/* Source Type Selection */}
              {!sourceType && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSourceType('reservation')}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-[var(--color-charcoal)] hover:bg-gray-50 transition-all group"
                  >
                    <Calendar className="w-8 h-8 text-[var(--color-gold)] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <p className="font-medium mb-1">予約から作成</p>
                    <p className="text-sm text-gray-500">本日の予約から選択</p>
                  </button>
                  <button
                    onClick={() => setSourceType('walkin')}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-[var(--color-charcoal)] hover:bg-gray-50 transition-all group"
                  >
                    <User className="w-8 h-8 text-[var(--color-accent)] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <p className="font-medium mb-1">ウォークインで作成</p>
                    <p className="text-sm text-gray-500">顧客を検索または新規入力</p>
                  </button>
                </div>
              )}

              {/* Reservation Selection */}
              {sourceType === 'reservation' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">本日の予約</h3>
                    <button
                      onClick={() => {
                        setSourceType(null);
                        setSelectedReservation(null);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      戻る
                    </button>
                  </div>
                  {todayReservations.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">本日の予約はありません</p>
                  ) : (
                    <div className="space-y-2">
                      {todayReservations.map((reservation) => (
                        <button
                          key={reservation.id}
                          onClick={() => setSelectedReservation(reservation)}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                            selectedReservation?.id === reservation.id
                              ? 'border-[var(--color-charcoal)] bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium mb-1">{reservation.user.name || '名前未登録'}</p>
                              <p className="text-sm text-gray-600 mb-1">{reservation.menuSummary}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {reservation.startTime}
                                </span>
                                <span>{formatPrice(reservation.totalPrice)}</span>
                              </div>
                            </div>
                            {selectedReservation?.id === reservation.id && (
                              <Check className="w-5 h-5 text-[var(--color-charcoal)]" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Walk-in Customer Selection */}
              {sourceType === 'walkin' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">顧客選択</h3>
                    <button
                      onClick={() => {
                        setSourceType(null);
                        setSelectedCustomer(null);
                        setWalkinName('');
                        setWalkinPhone('');
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      戻る
                    </button>
                  </div>

                  {/* Customer Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="顧客を検索（名前または電話番号）"
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>

                  {/* Customer List */}
                  {customerSearch && customers.length > 0 && (
                    <div className="mb-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {customers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearch('');
                          }}
                          className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <p className="font-medium">{customer.name || '名前未登録'}</p>
                          <p className="text-sm text-gray-500">{customer.phone || 'TEL未登録'}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Customer or New Input */}
                  {selectedCustomer ? (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium mb-1">選択中の顧客</p>
                          <p className="text-sm text-gray-600">{selectedCustomer.name}</p>
                          <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                        </div>
                        <button
                          onClick={() => setSelectedCustomer(null)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          変更
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">または新規顧客情報を入力</p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          顧客名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={walkinName}
                          onChange={(e) => setWalkinName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                          placeholder="例: 山田太郎"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          電話番号 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={walkinPhone}
                          onChange={(e) => setWalkinPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                          placeholder="例: 090-1234-5678"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: 明細入力 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium mb-4">メニュー・商品を選択</h2>

              {/* Menu Selection */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <MenuIcon className="w-5 h-5 text-[var(--color-gold)]" />
                  施術メニュー
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {/* カテゴリーごとにアコーディオン */}
                  {(() => {
                    // カテゴリーをユニークに取得（表示順でソート）
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
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[var(--color-gold)]" />
                  店販商品
                </h3>
                <div className="space-y-4">
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

              {/* Subtotal */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-medium">小計</span>
                  <span className="text-[var(--color-gold)] font-medium">
                    {formatPrice(calculateSubtotal())}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 支払・確定 */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium mb-4">支払情報と確定</h2>

              {/* Discount */}
              <div>
                <h3 className="font-medium mb-3">割引</h3>
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
              <div>
                <h3 className="font-medium mb-3">支払方法</h3>
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

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    売上日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    売上時刻 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={saleTime}
                    onChange={(e) => setSaleTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--color-accent)]"
                  rows={3}
                  placeholder="メモを入力してください"
                />
              </div>

              {/* Summary */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
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
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
            {step > 1 ? (
              <button
                onClick={handlePrevStep}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                戻る
              </button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <button
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-6 py-2 bg-[var(--color-charcoal)] text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                次へ
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '作成中...' : '会計を作成'}
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
