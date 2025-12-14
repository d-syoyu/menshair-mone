'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Banknote,
  Receipt,
  Package,
  Percent,
  Ticket,
  Settings,
  Clock,
  User,
  CreditCard,
  BarChart3,
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface SaleItem {
  itemType: 'MENU' | 'PRODUCT';
  menuName: string | null;
  productName: string | null;
  quantity: number;
}

interface Sale {
  id: string;
  saleNumber: string;
  customerName: string | null;
  saleDate: string;
  saleTime: string;
  totalAmount: number;
  paymentMethod: string;
  items: SaleItem[];
  user: {
    name: string | null;
  } | null;
}

interface Stats {
  todaySales: number;
  todayCount: number;
  weekSales: number;
  monthSales: number;
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

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function POSDashboard() {
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 今日の日付
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // 今週の開始日（月曜日）
      const weekStart = new Date(today);
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
      weekStart.setDate(weekStart.getDate() + daysToMonday);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // 今月の開始日
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      // 本日の会計を取得
      const todayRes = await fetch(`/api/admin/sales?startDate=${todayStr}&endDate=${todayStr}`);
      let todayData: Sale[] = [];
      if (!todayRes.ok) {
        console.error('Today sales fetch failed:', todayRes.status, await todayRes.text());
      } else {
        const data = await todayRes.json();
        todayData = Array.isArray(data) ? data : [];
      }
      setTodaySales(todayData.slice(0, 10));

      // 今週の会計を取得
      const weekRes = await fetch(`/api/admin/sales?startDate=${weekStartStr}`);
      const weekData: Sale[] = weekRes.ok ? await weekRes.json() : [];

      // 今月の会計を取得
      const monthRes = await fetch(`/api/admin/sales?startDate=${monthStartStr}`);
      const monthData: Sale[] = monthRes.ok ? await monthRes.json() : [];

      // 統計を計算
      const todaySalesTotal = todayData.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const weekSalesTotal = weekData.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const monthSalesTotal = monthData.reduce((sum, sale) => sum + sale.totalAmount, 0);

      setStats({
        todaySales: todaySalesTotal,
        todayCount: todayData.length,
        weekSales: weekSalesTotal,
        monthSales: monthSalesTotal,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setStats({
        todaySales: 0,
        todayCount: 0,
        weekSales: 0,
        monthSales: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getItemsSummary = (items: SaleItem[]) => {
    const names = items.map((item) =>
      item.itemType === 'MENU'
        ? item.menuName
        : `${item.productName}${item.quantity > 1 ? ` x${item.quantity}` : ''}`
    );
    if (names.length === 0) return 'なし';
    if (names.length <= 2) return names.join(', ');
    return `${names[0]} 他${names.length - 1}件`;
  };

  const today = new Date();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
      <div className="container-wide">
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
            管理画面に戻る
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-medium">POS・売上管理</h1>
              <p className="text-base md:text-lg text-gray-500">
                {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日（
                {WEEKDAYS[today.getDay()]}）
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8"
        >
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Banknote className="w-6 h-6 md:w-7 md:h-7 text-[var(--color-gold)]" />
              <span className="text-base md:text-lg text-gray-500">本日の売上</span>
            </div>
            <p className="text-3xl md:text-4xl font-light mb-2">
              {stats ? formatPrice(stats.todaySales) : '-'}
            </p>
            <p className="text-sm text-gray-400">
              {stats ? `${stats.todayCount}件` : '-'}
            </p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-6 h-6 md:w-7 md:h-7 text-[var(--color-accent)]" />
              <span className="text-base md:text-lg text-gray-500">今週の売上</span>
            </div>
            <p className="text-3xl md:text-4xl font-light">
              {stats ? formatPrice(stats.weekSales) : '-'}
            </p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-blue-500" />
              <span className="text-base md:text-lg text-gray-500">今月の売上</span>
            </div>
            <p className="text-3xl md:text-4xl font-light">
              {stats ? formatPrice(stats.monthSales) : '-'}
            </p>
          </div>
        </motion.div>

        {/* Quick Actions - Row 1 */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4"
        >
          <Link
            href="/admin/pos/sales/new"
            className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-[var(--color-accent)]/10 rounded-lg">
              <Receipt className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="font-medium text-sm">新規会計登録</p>
              <p className="text-xs text-gray-500 hidden sm:block">会計を作成</p>
            </div>
          </Link>

          <Link
            href="/admin/pos/sales"
            className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">会計履歴</p>
              <p className="text-xs text-gray-500 hidden sm:block">履歴・検索</p>
            </div>
          </Link>

          <Link
            href="/admin/pos/reports"
            className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-sm">売上レポート</p>
              <p className="text-xs text-gray-500 hidden sm:block">レポート・分析</p>
            </div>
          </Link>

          <Link
            href="/admin/pos/products"
            className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-[var(--color-gold)]/10 rounded-lg">
              <Package className="w-5 h-5 text-[var(--color-gold)]" />
            </div>
            <div>
              <p className="font-medium text-sm">商品管理</p>
              <p className="text-xs text-gray-500 hidden sm:block">店販商品</p>
            </div>
          </Link>
        </motion.div>

        {/* Quick Actions - Row 2 */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8"
        >
          <Link
            href="/admin/pos/discounts"
            className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-red-100 rounded-lg">
              <Percent className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-sm">割引管理</p>
              <p className="text-xs text-gray-500 hidden sm:block">店頭割引</p>
            </div>
          </Link>

          <Link
            href="/admin/pos/coupons"
            className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <Ticket className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-sm">クーポン管理</p>
              <p className="text-xs text-gray-500 hidden sm:block">クーポン設定</p>
            </div>
          </Link>

          <Link
            href="/admin/pos/settings"
            className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-2 bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-sm">設定</p>
              <p className="text-xs text-gray-500 hidden sm:block">税率など</p>
            </div>
          </Link>

          <div className="hidden sm:block" />
        </motion.div>

        {/* Today's Sales */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-lg md:text-xl font-medium">本日の会計履歴</h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-gray-500">読み込み中...</div>
          ) : todaySales.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              本日の会計はまだありません
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {todaySales.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/admin/pos/sales/${sale.id}`}
                  className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Time */}
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-gold)]/10">
                        <Clock className="w-5 h-5 text-[var(--color-gold)]" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{sale.saleTime}</p>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <p className="font-medium">
                          {sale.customerName || sale.user?.name || '名前未登録'}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {getItemsSummary(sale.items)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg md:text-xl text-[var(--color-gold)] font-medium">
                        {formatPrice(sale.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{sale.saleNumber}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {todaySales.length > 0 && (
            <div className="p-4 border-t border-gray-100 text-center">
              <Link
                href="/admin/pos/sales"
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
                すべての会計を見る
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
