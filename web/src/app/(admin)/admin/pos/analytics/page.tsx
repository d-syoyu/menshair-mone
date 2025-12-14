'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  CreditCard,
  Scissors,
  Package,
  Filter,
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

interface AnalyticsData {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalSales: number;
    saleCount: number;
    averagePerCustomer: number;
    totalMenuAmount: number;
    totalProductAmount: number;
    businessDays: number;
    averagePerBusinessDay: number;
  };
  paymentMethod: {
    data: Record<string, { count: number; amount: number; percentage: number }>;
    sortedList: Array<{
      method: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
  };
  menu: {
    topMenus: Array<{
      menuName: string;
      category: string | null;
      count: number;
      amount: number;
      percentage: number;
    }>;
    topCategories: Array<{
      category: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
    totalAmount: number;
  };
  product: {
    topProducts: Array<{
      productName: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
    totalAmount: number;
  };
  dailyTrend: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
}

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'payment' | 'menu' | 'product'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/analytics?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error('データの取得に失敗しました');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

  const formatShortPrice = (price: number) => {
    if (price >= 10000) {
      return `¥${(price / 10000).toFixed(1)}万`;
    }
    return `¥${(price / 1000).toFixed(0)}k`;
  };

  const setPresetPeriod = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Prepare chart data
  const paymentChartData = data
    ? data.paymentMethod.sortedList.map((item) => ({
        name: PAYMENT_METHOD_LABELS[item.method] || item.method,
        value: item.amount,
        count: item.count,
        percentage: item.percentage,
      }))
    : [];

  const menuChartData = data
    ? data.menu.topMenus.slice(0, 8).map((item) => ({
        name: item.menuName.length > 10 ? item.menuName.substring(0, 10) + '...' : item.menuName,
        fullName: item.menuName,
        value: item.amount,
        count: item.count,
      }))
    : [];

  const categoryChartData = data
    ? data.menu.topCategories.map((item) => ({
        name: item.category,
        value: item.amount,
        count: item.count,
      }))
    : [];

  const productChartData = data
    ? data.product.topProducts.slice(0, 8).map((item) => ({
        name: item.productName.length > 10 ? item.productName.substring(0, 10) + '...' : item.productName,
        fullName: item.productName,
        value: item.amount,
        count: item.count,
      }))
    : [];

  const trendChartData = data
    ? data.dailyTrend.map((d) => ({
        ...d,
        shortDate: d.date.split('-').slice(1).join('/'),
      }))
    : [];

  const tabs = [
    { id: 'overview', label: '概要', icon: TrendingUp },
    { id: 'payment', label: '支払方法', icon: CreditCard },
    { id: 'menu', label: 'メニュー', icon: Scissors },
    { id: 'product', label: '商品', icon: Package },
  ] as const;

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
          <h1 className="text-2xl font-medium">売上分析</h1>
          <p className="text-gray-600 mt-2">
            期間を指定して売上データを詳細に分析できます
          </p>
        </motion.div>

        {/* Period Filter */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="font-medium">期間</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPresetPeriod(7)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px]"
              >
                7日間
              </button>
              <button
                onClick={() => setPresetPeriod(30)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px]"
              >
                30日間
              </button>
              <button
                onClick={() => setPresetPeriod(90)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px]"
              >
                90日間
              </button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
              <span className="text-gray-400">〜</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="border-b border-gray-200 mb-6"
        >
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
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

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">読み込み中...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : data ? (
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Summary Cards */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-500 mb-2">総売上</p>
                    <p className="text-3xl md:text-4xl font-light text-[var(--color-gold)]">
                      {formatPrice(data.summary.totalSales)}
                    </p>
                  </div>
                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-500 mb-2">会計件数</p>
                    <p className="text-3xl md:text-4xl font-light">{data.summary.saleCount}件</p>
                  </div>
                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-500 mb-2">平均客単価</p>
                    <p className="text-3xl md:text-4xl font-light">
                      {formatPrice(data.summary.averagePerCustomer)}
                    </p>
                  </div>
                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-500 mb-2">
                      営業日平均売上
                      <span className="text-xs ml-1">({data.summary.businessDays}日)</span>
                    </p>
                    <p className="text-3xl md:text-4xl font-light">
                      {formatPrice(data.summary.averagePerBusinessDay)}
                    </p>
                  </div>
                </motion.div>

                {/* Daily Trend */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="bg-white p-6 rounded-xl shadow-sm"
                >
                  <h2 className="text-lg font-medium mb-4">日別売上推移</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="shortDate" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(v) => formatShortPrice(v)} />
                        <Tooltip
                          formatter={(value: number) => [formatPrice(value), '売上']}
                          labelFormatter={(label) => label}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#D4A64A"
                          strokeWidth={2}
                          dot={{ fill: '#D4A64A', strokeWidth: 0, r: 2 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Menu vs Product */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4">売上構成</h2>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'メニュー', value: data.summary.totalMenuAmount },
                              { name: '商品', value: data.summary.totalProductAmount },
                            ].filter((d) => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }: any) =>
                              `${name} ${(((percent || 0) * 100).toFixed(0))}%`
                            }
                          >
                            <Cell fill="#1F3D30" />
                            <Cell fill="#D4A64A" />
                          </Pie>
                          <Tooltip formatter={(value: number) => formatPrice(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4">カテゴリ別売上</h2>
                    {categoryChartData.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoryChartData} layout="vertical">
                            <XAxis
                              type="number"
                              tickFormatter={(v) => formatShortPrice(v)}
                            />
                            <YAxis type="category" dataKey="name" width={80} />
                            <Tooltip formatter={(value: number) => formatPrice(value)} />
                            <Bar dataKey="value" fill="#1F3D30" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">データがありません</p>
                    )}
                  </div>
                </motion.div>
              </>
            )}

            {/* Payment Method Tab */}
            {activeTab === 'payment' && (
              <>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4">支払方法別構成比</h2>
                    {paymentChartData.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={paymentChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
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
                    ) : (
                      <p className="text-gray-500 text-center py-8">データがありません</p>
                    )}
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4">支払方法別詳細</h2>
                    {data.paymentMethod.sortedList.length > 0 ? (
                      <div className="space-y-3">
                        {data.paymentMethod.sortedList.map((item, index) => (
                          <div
                            key={item.method}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <div>
                                <p className="font-medium">
                                  {PAYMENT_METHOD_LABELS[item.method] || item.method}
                                </p>
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
                    ) : (
                      <p className="text-gray-500 text-center py-8">データがありません</p>
                    )}
                  </div>
                </motion.div>
              </>
            )}

            {/* Menu Tab */}
            {activeTab === 'menu' && (
              <>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4">人気メニューランキング</h2>
                    {menuChartData.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={menuChartData} layout="vertical">
                            <XAxis
                              type="number"
                              tickFormatter={(v) => formatShortPrice(v)}
                            />
                            <YAxis type="category" dataKey="name" width={100} />
                            <Tooltip
                              formatter={(value: number) => formatPrice(value)}
                              labelFormatter={(label, payload) =>
                                payload?.[0]?.payload?.fullName || label
                              }
                            />
                            <Bar dataKey="value" fill="#D4A64A" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">データがありません</p>
                    )}
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4">メニュー売上詳細</h2>
                    {data.menu.topMenus.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {data.menu.topMenus.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 flex items-center justify-center bg-[var(--color-gold)]/10 text-[var(--color-gold)] text-sm font-medium rounded">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium">{item.menuName}</p>
                                {item.category && (
                                  <p className="text-sm text-gray-500">{item.category}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatPrice(item.amount)}</p>
                              <p className="text-sm text-gray-500">
                                {item.count}件 ({item.percentage}%)
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">データがありません</p>
                    )}
                  </div>
                </motion.div>
              </>
            )}

            {/* Product Tab */}
            {activeTab === 'product' && (
              <>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4">人気商品ランキング</h2>
                    {productChartData.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={productChartData} layout="vertical">
                            <XAxis
                              type="number"
                              tickFormatter={(v) => formatShortPrice(v)}
                            />
                            <YAxis type="category" dataKey="name" width={100} />
                            <Tooltip
                              formatter={(value: number) => formatPrice(value)}
                              labelFormatter={(label, payload) =>
                                payload?.[0]?.payload?.fullName || label
                              }
                            />
                            <Bar dataKey="value" fill="#1F3D30" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">データがありません</p>
                    )}
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-medium mb-4">商品売上詳細</h2>
                    {data.product.topProducts.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {data.product.topProducts.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 flex items-center justify-center bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-sm font-medium rounded">
                                {index + 1}
                              </span>
                              <p className="font-medium">{item.productName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatPrice(item.amount)}</p>
                              <p className="text-sm text-gray-500">
                                {item.count}個 ({item.percentage}%)
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">データがありません</p>
                    )}
                  </div>
                </motion.div>

                {/* Product Summary */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  className="bg-white p-6 rounded-xl shadow-sm"
                >
                  <h2 className="text-lg font-medium mb-4">商品売上サマリー</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">商品売上合計</p>
                      <p className="text-xl font-medium">
                        {formatPrice(data.product.totalAmount)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">商品種類数</p>
                      <p className="text-xl font-medium">
                        {data.product.topProducts.length}種類
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">売上構成比</p>
                      <p className="text-xl font-medium">
                        {data.summary.totalSales > 0
                          ? Math.round(
                              (data.product.totalAmount / data.summary.totalSales) * 100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
