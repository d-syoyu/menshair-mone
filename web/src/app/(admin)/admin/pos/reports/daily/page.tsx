'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  Users,
  CreditCard,
  Clock,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: '現金',
  CREDIT_CARD: 'クレカ',
  PAYPAY: 'PayPay',
  LINE_PAY: 'LINE Pay',
  RAKUTEN_PAY: '楽天ペイ',
  AU_PAY: 'au PAY',
  D_PAYMENT: 'd払い',
  MERPAY: 'メルペイ',
  BANK_TRANSFER: '振込',
  OTHER: 'その他',
};

const COLORS = [
  '#1F3D30',
  '#D4A64A',
  '#4A90A4',
  '#8B5A2B',
  '#6B8E23',
  '#CD5C5C',
  '#9370DB',
  '#20B2AA',
  '#FF6347',
  '#708090',
];

interface DailyReport {
  date: string;
  summary: {
    totalSales: number;
    saleCount: number;
    averagePerCustomer: number;
    totalDiscount: number;
    totalTax: number;
    menuTotal: number;
    productTotal: number;
  };
  paymentMethodBreakdown: Record<string, { count: number; amount: number }>;
  categoryBreakdown: Record<string, { count: number; amount: number }>;
  hourlyBreakdown: Record<string, { count: number; amount: number }>;
  sales: Array<{
    id: string;
    saleNumber: string;
    saleTime: string;
    totalAmount: number;
    paymentMethod: string;
    customerName: string | null;
    itemsSummary: string;
  }>;
}

export default function DailyReportPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [report, setReport] = useState<DailyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [selectedDate]);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/daily?date=${selectedDate}`);
      if (!res.ok) throw new Error('データの取得に失敗しました');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const goToPrevDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    const today = new Date();
    if (date <= today) {
      setSelectedDate(date.toISOString().split('T')[0]);
    }
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
  };

  // Prepare chart data
  const paymentChartData = report
    ? Object.entries(report.paymentMethodBreakdown).map(([method, data]) => ({
        name: PAYMENT_METHOD_LABELS[method] || method,
        value: data.amount,
        count: data.count,
      }))
    : [];

  const categoryChartData = report
    ? Object.entries(report.categoryBreakdown)
        .map(([category, data]) => ({
          name: category,
          value: data.amount,
          count: data.count,
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  const hourlyChartData = report
    ? Object.entries(report.hourlyBreakdown)
        .map(([hour, data]) => ({
          hour,
          amount: data.amount,
          count: data.count,
        }))
    : [];

  const menuProductData = report
    ? [
        { name: 'メニュー', value: report.summary.menuTotal },
        { name: '商品', value: report.summary.productTotal },
      ].filter((item) => item.value > 0)
    : [];

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-medium">日別売上レポート</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevDay}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <button
                onClick={goToNextDay}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={selectedDate === new Date().toISOString().split('T')[0]}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-gray-600 mt-2">{formatDate(selectedDate)}</p>
        </motion.div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">読み込み中...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : report ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[var(--color-gold)]/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-[var(--color-gold)]" />
                  </div>
                  <span className="text-gray-600">総売上</span>
                </div>
                <p className="text-3xl font-light text-[var(--color-gold)]">
                  {formatPrice(report.summary.totalSales)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[var(--color-accent)]/10 rounded-lg">
                    <Users className="w-5 h-5 text-[var(--color-accent)]" />
                  </div>
                  <span className="text-gray-600">会計件数</span>
                </div>
                <p className="text-3xl font-light">{report.summary.saleCount}件</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-gray-600">平均客単価</span>
                </div>
                <p className="text-3xl font-light">
                  {formatPrice(report.summary.averagePerCustomer)}
                </p>
              </div>
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Method Chart */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <h2 className="text-lg font-medium mb-4">支払方法別</h2>
                {paymentChartData.length > 0 ? (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {paymentChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatPrice(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {paymentChartData.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-medium">{formatPrice(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">データがありません</p>
                )}
              </motion.div>

              {/* Menu vs Product Chart */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <h2 className="text-lg font-medium mb-4">メニュー vs 商品</h2>
                {menuProductData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={menuProductData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }: any) =>
                            `${name} ${((percent || 0) * 100).toFixed(0)}%`
                          }
                        >
                          <Cell fill="#1F3D30" />
                          <Cell fill="#D4A64A" />
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatPrice(value)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">データがありません</p>
                )}
              </motion.div>
            </div>

            {/* Category Chart */}
            {categoryChartData.length > 0 && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <h2 className="text-lg font-medium mb-4">カテゴリ別売上</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} layout="vertical">
                      <XAxis type="number" tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip formatter={(value: number) => formatPrice(value)} />
                      <Bar dataKey="value" fill="#1F3D30" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Hourly Chart */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                時間帯別売上
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyChartData}>
                    <XAxis dataKey="hour" />
                    <YAxis tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatPrice(value),
                        name === 'amount' ? '売上' : '件数',
                      ]}
                    />
                    <Bar dataKey="amount" fill="#D4A64A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Sales List */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <h2 className="text-lg font-medium mb-4">当日の会計一覧</h2>
              {report.sales.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {report.sales.map((sale) => (
                    <Link
                      key={sale.id}
                      href={`/admin/pos/sales/${sale.id}`}
                      className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{sale.saleTime}</span>
                          <span className="font-medium">{sale.saleNumber}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {sale.customerName || '名前未登録'} - {sale.itemsSummary || 'なし'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[var(--color-gold)]">
                          {formatPrice(sale.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">会計がありません</p>
              )}
            </motion.div>

            {/* Additional Stats */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-500 mb-1">メニュー売上</p>
                <p className="text-lg font-medium">{formatPrice(report.summary.menuTotal)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-500 mb-1">商品売上</p>
                <p className="text-lg font-medium">{formatPrice(report.summary.productTotal)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-500 mb-1">割引総額</p>
                <p className="text-lg font-medium text-red-500">
                  -{formatPrice(report.summary.totalDiscount)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-500 mb-1">消費税</p>
                <p className="text-lg font-medium">{formatPrice(report.summary.totalTax)}</p>
              </div>
            </motion.div>
          </div>
        ) : null}

        {/* Navigation */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-8 flex justify-center"
        >
          <Link
            href="/admin/pos/reports/monthly"
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            月別レポートを見る
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
