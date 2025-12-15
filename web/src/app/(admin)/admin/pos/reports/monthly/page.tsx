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
  TrendingDown,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
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

interface MonthlyReport {
  year: number;
  month: number;
  summary: {
    totalSales: number;
    saleCount: number;
    averagePerCustomer: number;
    totalDiscount: number;
    totalTax: number;
    menuTotal: number;
    productTotal: number;
    prevTotalSales: number;
    prevSaleCount: number;
    prevAveragePerCustomer: number;
    salesChange: number;
    countChange: number;
  };
  dailyData: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
  paymentMethodBreakdown: Record<string, { count: number; amount: number }>;
  categoryBreakdown: Record<string, { count: number; amount: number }>;
  weekdayBreakdown: Record<string, { count: number; amount: number }>;
}

export default function MonthlyReportPage() {
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [selectedYear, selectedMonth]);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/reports/monthly?year=${selectedYear}&month=${selectedMonth}`
      );
      if (!res.ok) throw new Error('データの取得に失敗しました');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    const now = new Date();
    const current = new Date(selectedYear, selectedMonth - 1);
    const next = new Date(selectedYear, selectedMonth);

    if (next <= now) {
      if (selectedMonth === 12) {
        setSelectedYear(selectedYear + 1);
        setSelectedMonth(1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

  const formatShortPrice = (price: number) => {
    if (price >= 10000) {
      return `¥${(price / 10000).toFixed(1)}万`;
    }
    return `¥${(price / 1000).toFixed(0)}k`;
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

  const weekdayChartData = report
    ? Object.entries(report.weekdayBreakdown).map(([day, data]) => ({
        day,
        amount: data.amount,
        count: data.count,
      }))
    : [];

  const dailyChartData = report
    ? report.dailyData.map((d) => ({
        ...d,
        day: parseInt(d.date.split('-')[2]),
      }))
    : [];

  const isCurrentMonth =
    selectedYear === new Date().getFullYear() &&
    selectedMonth === new Date().getMonth() + 1;

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
            <h1 className="text-2xl font-medium">月別売上レポート</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[var(--color-accent)]"
                >
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}年
                      </option>
                    );
                  })}
                </select>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[var(--color-accent)]"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}月
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isCurrentMonth}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            {selectedYear}年{selectedMonth}月
          </p>
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
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
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
                {report.summary.salesChange !== 0 && (
                  <div
                    className={`flex items-center gap-1 mt-2 text-sm ${
                      report.summary.salesChange > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {report.summary.salesChange > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span>前月比 {report.summary.salesChange}%</span>
                  </div>
                )}
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[var(--color-accent)]/10 rounded-lg">
                    <Users className="w-5 h-5 text-[var(--color-accent)]" />
                  </div>
                  <span className="text-gray-600">会計件数</span>
                </div>
                <p className="text-3xl font-light">{report.summary.saleCount}件</p>
                {report.summary.countChange !== 0 && (
                  <div
                    className={`flex items-center gap-1 mt-2 text-sm ${
                      report.summary.countChange > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {report.summary.countChange > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span>前月比 {report.summary.countChange}%</span>
                  </div>
                )}
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
                <p className="text-sm text-gray-500 mt-2">
                  前月: {formatPrice(report.summary.prevAveragePerCustomer)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-gray-600">営業日平均</span>
                </div>
                <p className="text-3xl font-light">
                  {formatPrice(
                    Math.round(
                      report.summary.totalSales /
                        (report.dailyData.filter((d) => d.amount > 0).length || 1)
                    )
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {report.dailyData.filter((d) => d.amount > 0).length}営業日
                </p>
              </div>
            </motion.div>

            {/* Daily Trend Chart */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <h2 className="text-lg font-medium mb-4">日別売上推移</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tickFormatter={(v) => `${v}日`} />
                    <YAxis tickFormatter={(v) => formatShortPrice(v)} />
                    <Tooltip
                      formatter={(value: number) => [formatPrice(value), '売上']}
                      labelFormatter={(label) => `${label}日`}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#D4A64A"
                      strokeWidth={2}
                      dot={{ fill: '#D4A64A', strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
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

              {/* Weekday Chart */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <h2 className="text-lg font-medium mb-4">曜日別売上</h2>
                {weekdayChartData.some((d) => d.amount > 0) ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekdayChartData}>
                        <XAxis dataKey="day" />
                        <YAxis tickFormatter={(v) => formatShortPrice(v)} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === 'amount' ? formatPrice(value) : `${value}件`,
                            name === 'amount' ? '売上' : '件数',
                          ]}
                        />
                        <Bar dataKey="amount" fill="#D4A64A" radius={[4, 4, 0, 0]} />
                      </BarChart>
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
                      <XAxis
                        type="number"
                        tickFormatter={(v) => formatShortPrice(v)}
                      />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip formatter={(value: number) => formatPrice(value)} />
                      <Bar dataKey="value" fill="#D4A64A" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

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
            href="/admin/pos/reports/daily"
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            日別レポートを見る
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
