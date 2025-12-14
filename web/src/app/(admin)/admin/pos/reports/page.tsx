'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  TrendingUp,
  Users,
  CreditCard,
  Clock,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Scissors,
  Package,
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

type TabType = 'daily' | 'monthly' | 'analytics';

// Daily Report Types
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

// Monthly Report Types
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
  dailyData: Array<{ date: string; amount: number; count: number }>;
  paymentMethodBreakdown: Record<string, { count: number; amount: number }>;
  categoryBreakdown: Record<string, { count: number; amount: number }>;
  weekdayBreakdown: Record<string, { count: number; amount: number }>;
}

// Analytics Types
interface AnalyticsData {
  period: { startDate: string; endDate: string };
  summary: {
    totalSales: number;
    saleCount: number;
    averagePerCustomer: number;
    totalMenuAmount: number;
    totalProductAmount: number;
  };
  paymentMethod: {
    sortedList: Array<{ method: string; count: number; amount: number; percentage: number }>;
  };
  menu: {
    topMenus: Array<{ menuName: string; category: string | null; count: number; amount: number; percentage: number }>;
    topCategories: Array<{ category: string; count: number; amount: number; percentage: number }>;
  };
  product: {
    topProducts: Array<{ productName: string; count: number; amount: number; percentage: number }>;
    totalAmount: number;
  };
  dailyTrend: Array<{ date: string; amount: number; count: number }>;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('daily');

  // Daily state
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);

  // Monthly state
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);

  // Analytics state
  const [analyticsStartDate, setAnalyticsStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [analyticsEndDate, setAnalyticsEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'daily') fetchDailyReport();
    else if (activeTab === 'monthly') fetchMonthlyReport();
    else fetchAnalytics();
  }, [activeTab, selectedDate, selectedYear, selectedMonth, analyticsStartDate, analyticsEndDate]);

  const fetchDailyReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/daily?date=${selectedDate}`);
      if (!res.ok) throw new Error('データの取得に失敗しました');
      setDailyReport(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/monthly?year=${selectedYear}&month=${selectedMonth}`);
      if (!res.ok) throw new Error('データの取得に失敗しました');
      setMonthlyReport(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?startDate=${analyticsStartDate}&endDate=${analyticsEndDate}`);
      if (!res.ok) throw new Error('データの取得に失敗しました');
      setAnalyticsData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;
  const formatShortPrice = (price: number) => price >= 10000 ? `¥${(price / 10000).toFixed(1)}万` : `¥${(price / 1000).toFixed(0)}k`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
  };

  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    if (d <= new Date()) setSelectedDate(d.toISOString().split('T')[0]);
  };

  const goToPrevMonth = () => {
    if (selectedMonth === 1) { setSelectedYear(selectedYear - 1); setSelectedMonth(12); }
    else setSelectedMonth(selectedMonth - 1);
  };

  const goToNextMonth = () => {
    const now = new Date();
    const next = new Date(selectedYear, selectedMonth);
    if (next <= now) {
      if (selectedMonth === 12) { setSelectedYear(selectedYear + 1); setSelectedMonth(1); }
      else setSelectedMonth(selectedMonth + 1);
    }
  };

  const setPresetPeriod = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setAnalyticsStartDate(start.toISOString().split('T')[0]);
    setAnalyticsEndDate(end.toISOString().split('T')[0]);
  };

  const tabs = [
    { id: 'daily' as const, label: '日別', icon: Calendar },
    { id: 'monthly' as const, label: '月別', icon: CalendarDays },
    { id: 'analytics' as const, label: '詳細分析', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
      <div className="container-wide max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-6">
          <Link href="/admin/pos" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-4 px-3 py-2 -ml-3 min-h-[44px]">
            <ArrowLeft className="w-5 h-5" />
            POSダッシュボードに戻る
          </Link>
          <h1 className="text-2xl font-medium">売上レポート・分析</h1>
        </motion.div>

        {/* Tabs */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="border-b border-gray-200 mb-6">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[var(--color-charcoal)] text-[var(--color-charcoal)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Daily Tab Controls */}
        {activeTab === 'daily' && (
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex items-center gap-2 mb-6">
            <button onClick={goToPrevDay} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
            <button onClick={goToNextDay} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" disabled={selectedDate === new Date().toISOString().split('T')[0]}>
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="ml-2 text-gray-600">{formatDate(selectedDate)}</span>
          </motion.div>
        )}

        {/* Monthly Tab Controls */}
        {activeTab === 'monthly' && (
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex items-center gap-2 mb-6">
            <button onClick={goToPrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-3 py-2 border border-gray-200 rounded-lg bg-white">
              {[...Array(5)].map((_, i) => <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}年</option>)}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="px-3 py-2 border border-gray-200 rounded-lg bg-white">
              {[...Array(12)].map((_, i) => <option key={i} value={i + 1}>{i + 1}月</option>)}
            </select>
            <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Analytics Tab Controls */}
        {activeTab === 'analytics' && (
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="font-medium">期間</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setPresetPeriod(7)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">7日間</button>
                <button onClick={() => setPresetPeriod(30)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">30日間</button>
                <button onClick={() => setPresetPeriod(90)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">90日間</button>
              </div>
              <div className="flex items-center gap-2 sm:ml-auto">
                <input type="date" value={analyticsStartDate} onChange={(e) => setAnalyticsStartDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm" />
                <span className="text-gray-400">〜</span>
                <input type="date" value={analyticsEndDate} onChange={(e) => setAnalyticsEndDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading / Error */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">読み込み中...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : (
          <>
            {/* Daily Report Content */}
            {activeTab === 'daily' && dailyReport && (
              <div className="space-y-6">
                {/* Summary */}
                <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[var(--color-gold)]/10 rounded-lg"><TrendingUp className="w-5 h-5 text-[var(--color-gold)]" /></div>
                      <span className="text-gray-600">総売上</span>
                    </div>
                    <p className="text-3xl font-light text-[var(--color-gold)]">{formatPrice(dailyReport.summary.totalSales)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[var(--color-accent)]/10 rounded-lg"><Users className="w-5 h-5 text-[var(--color-accent)]" /></div>
                      <span className="text-gray-600">会計件数</span>
                    </div>
                    <p className="text-3xl font-light">{dailyReport.summary.saleCount}件</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg"><CreditCard className="w-5 h-5 text-blue-600" /></div>
                      <span className="text-gray-600">平均客単価</span>
                    </div>
                    <p className="text-3xl font-light">{formatPrice(dailyReport.summary.averagePerCustomer)}</p>
                  </div>
                </motion.div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4">支払方法別</h2>
                    {Object.keys(dailyReport.paymentMethodBreakdown).length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(dailyReport.paymentMethodBreakdown).map(([m, d]) => ({ name: PAYMENT_METHOD_LABELS[m] || m, value: d.amount }))}
                              cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value"
                              label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            >
                              {Object.keys(dailyReport.paymentMethodBreakdown).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v: number) => formatPrice(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <p className="text-gray-500 text-center py-8">データがありません</p>}
                  </motion.div>

                  <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-gray-400" />時間帯別売上</h2>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(dailyReport.hourlyBreakdown).map(([h, d]) => ({ hour: h, amount: d.amount }))}>
                          <XAxis dataKey="hour" />
                          <YAxis tickFormatter={(v) => formatShortPrice(v)} />
                          <Tooltip formatter={(v: number) => [formatPrice(v), '売上']} />
                          <Bar dataKey="amount" fill="#D4A64A" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </div>

                {/* Sales List */}
                <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm">
                  <h2 className="text-lg font-medium mb-4">当日の会計一覧</h2>
                  {dailyReport.sales.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {dailyReport.sales.map((sale) => (
                        <Link key={sale.id} href={`/admin/pos/sales/${sale.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{sale.saleTime}</span>
                              <span className="font-medium">{sale.saleNumber}</span>
                            </div>
                            <p className="text-sm text-gray-500">{sale.customerName || '名前未登録'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-[var(--color-gold)]">{formatPrice(sale.totalAmount)}</p>
                            <p className="text-xs text-gray-500">{PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 text-center py-8">会計がありません</p>}
                </motion.div>
              </div>
            )}

            {/* Monthly Report Content */}
            {activeTab === 'monthly' && monthlyReport && (
              <div className="space-y-6">
                {/* Summary */}
                <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[var(--color-gold)]/10 rounded-lg"><TrendingUp className="w-5 h-5 text-[var(--color-gold)]" /></div>
                      <span className="text-gray-600">総売上</span>
                    </div>
                    <p className="text-3xl font-light text-[var(--color-gold)]">{formatPrice(monthlyReport.summary.totalSales)}</p>
                    {monthlyReport.summary.salesChange !== 0 && (
                      <div className={`flex items-center gap-1 mt-2 text-sm ${monthlyReport.summary.salesChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {monthlyReport.summary.salesChange > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>前月比 {monthlyReport.summary.salesChange}%</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[var(--color-accent)]/10 rounded-lg"><Users className="w-5 h-5 text-[var(--color-accent)]" /></div>
                      <span className="text-gray-600">会計件数</span>
                    </div>
                    <p className="text-3xl font-light">{monthlyReport.summary.saleCount}件</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg"><CreditCard className="w-5 h-5 text-blue-600" /></div>
                      <span className="text-gray-600">平均客単価</span>
                    </div>
                    <p className="text-3xl font-light">{formatPrice(monthlyReport.summary.averagePerCustomer)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg"><Calendar className="w-5 h-5 text-purple-600" /></div>
                      <span className="text-gray-600">営業日平均</span>
                    </div>
                    <p className="text-3xl font-light">{formatPrice(Math.round(monthlyReport.summary.totalSales / (monthlyReport.dailyData.filter(d => d.amount > 0).length || 1)))}</p>
                  </div>
                </motion.div>

                {/* Daily Trend */}
                <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm">
                  <h2 className="text-lg font-medium mb-4">日別売上推移</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyReport.dailyData.map(d => ({ ...d, day: parseInt(d.date.split('-')[2]) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" tickFormatter={(v) => `${v}日`} />
                        <YAxis tickFormatter={(v) => formatShortPrice(v)} />
                        <Tooltip formatter={(v: number) => [formatPrice(v), '売上']} labelFormatter={(l) => `${l}日`} />
                        <Line type="monotone" dataKey="amount" stroke="#D4A64A" strokeWidth={2} dot={{ fill: '#D4A64A', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4">支払方法別</h2>
                    {Object.keys(monthlyReport.paymentMethodBreakdown).length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(monthlyReport.paymentMethodBreakdown).map(([m, d]) => ({ name: PAYMENT_METHOD_LABELS[m] || m, value: d.amount }))}
                              cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value"
                            >
                              {Object.keys(monthlyReport.paymentMethodBreakdown).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v: number) => formatPrice(v)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <p className="text-gray-500 text-center py-8">データがありません</p>}
                  </motion.div>

                  <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4">曜日別売上</h2>
                    {Object.values(monthlyReport.weekdayBreakdown).some(d => d.amount > 0) ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={Object.entries(monthlyReport.weekdayBreakdown).map(([d, v]) => ({ day: d, amount: v.amount }))}>
                            <XAxis dataKey="day" />
                            <YAxis tickFormatter={(v) => formatShortPrice(v)} />
                            <Tooltip formatter={(v: number) => [formatPrice(v), '売上']} />
                            <Bar dataKey="amount" fill="#1F3D30" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <p className="text-gray-500 text-center py-8">データがありません</p>}
                  </motion.div>
                </div>
              </div>
            )}

            {/* Analytics Content */}
            {activeTab === 'analytics' && analyticsData && (
              <div className="space-y-6">
                {/* Summary */}
                <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-500 mb-2">総売上</p>
                    <p className="text-2xl sm:text-3xl font-light text-[var(--color-gold)]">{formatPrice(analyticsData.summary.totalSales)}</p>
                  </div>
                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-500 mb-2">会計件数</p>
                    <p className="text-2xl sm:text-3xl font-light">{analyticsData.summary.saleCount}件</p>
                  </div>
                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-500 mb-2">平均客単価</p>
                    <p className="text-2xl sm:text-3xl font-light">{formatPrice(analyticsData.summary.averagePerCustomer)}</p>
                  </div>
                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-500 mb-2">日平均売上</p>
                    <p className="text-2xl sm:text-3xl font-light">{formatPrice(Math.round(analyticsData.summary.totalSales / (analyticsData.dailyTrend.length || 1)))}</p>
                  </div>
                </motion.div>

                {/* Trend */}
                <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm">
                  <h2 className="text-lg font-medium mb-4">日別売上推移</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.dailyTrend.map(d => ({ ...d, shortDate: d.date.split('-').slice(1).join('/') }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="shortDate" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(v) => formatShortPrice(v)} />
                        <Tooltip formatter={(v: number) => [formatPrice(v), '売上']} />
                        <Line type="monotone" dataKey="amount" stroke="#D4A64A" strokeWidth={2} dot={{ fill: '#D4A64A', r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Payment & Category */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-gray-400" />支払方法別</h2>
                    {analyticsData.paymentMethod.sortedList.length > 0 ? (
                      <div className="space-y-3">
                        {analyticsData.paymentMethod.sortedList.map((item, i) => (
                          <div key={item.method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <div>
                                <p className="font-medium">{PAYMENT_METHOD_LABELS[item.method] || item.method}</p>
                                <p className="text-sm text-gray-500">{item.count}件</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatPrice(item.amount)}</p>
                              <p className="text-sm text-gray-500">{item.percentage}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-gray-500 text-center py-8">データがありません</p>}
                  </motion.div>

                  <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><Scissors className="w-5 h-5 text-gray-400" />人気メニュー TOP5</h2>
                    {analyticsData.menu.topMenus.length > 0 ? (
                      <div className="space-y-3">
                        {analyticsData.menu.topMenus.slice(0, 5).map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 flex items-center justify-center bg-[var(--color-gold)]/10 text-[var(--color-gold)] text-sm font-medium rounded">{i + 1}</span>
                              <div>
                                <p className="font-medium">{item.menuName}</p>
                                {item.category && <p className="text-sm text-gray-500">{item.category}</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatPrice(item.amount)}</p>
                              <p className="text-sm text-gray-500">{item.count}件</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-gray-500 text-center py-8">データがありません</p>}
                  </motion.div>
                </div>

                {/* Products */}
                {analyticsData.product.topProducts.length > 0 && (
                  <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-gray-400" />人気商品 TOP5</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {analyticsData.product.topProducts.slice(0, 5).map((item, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium rounded">{i + 1}</span>
                            <p className="font-medium text-sm truncate">{item.productName}</p>
                          </div>
                          <p className="text-lg font-medium text-[var(--color-gold)]">{formatPrice(item.amount)}</p>
                          <p className="text-xs text-gray-500">{item.count}個販売</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
