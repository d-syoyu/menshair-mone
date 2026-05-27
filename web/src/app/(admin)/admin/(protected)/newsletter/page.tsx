'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Send,
  RefreshCw,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  publishedAt: string;
  status: string;
  targets: string[];
  coverImage: string | null;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// ステータスのスタイル
const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  '下書き': { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Clock className="w-3 h-3" /> },
  '送信中': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
  '送信済み': { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
  '送信失敗': { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3 h-3" /> },
};

export default function NewsletterPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<NewsItem | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ニュース一覧を取得
  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/newsletter');
      const data = await res.json();
      if (data.success) {
        setNews(data.news);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // トースト自動非表示
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 送信処理
  const handleSend = async (newsItem: NewsItem) => {
    setSending(newsItem.id);
    setConfirmModal(null);

    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: newsItem.id }),
      });
      const data = await res.json();

      if (data.success) {
        setToast({
          type: 'success',
          message: `「${newsItem.title}」を${data.sentCount}件のメールアドレスに送信しました`,
        });
        // 一覧を更新
        fetchNews();
      } else {
        setToast({
          type: 'error',
          message: `送信に失敗しました: ${data.error}`,
        });
      }
    } catch (error) {
      setToast({
        type: 'error',
        message: '送信中にエラーが発生しました',
      });
    } finally {
      setSending(null);
    }
  };

  const getStatusStyle = (status: string) => {
    return STATUS_STYLES[status] || STATUS_STYLES['下書き'];
  };

  return (
    <div className="min-h-screen bg-dark pt-24 pb-20">
      <div className="container-narrow">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 rounded-lg bg-card hover:bg-card-hover transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">ニュースレター送信</h1>
                <p className="text-sm text-text-secondary mt-1">
                  Notionのお知らせをメール配信
                </p>
              </div>
            </div>
            <button
              onClick={fetchNews}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-card-hover rounded-lg transition-colors text-text-secondary"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>

          {/* News List */}
          <div className="bg-card rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-text-secondary">
                読み込み中...
              </div>
            ) : news.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>お知らせがありません</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {news.map((item) => {
                  const statusStyle = getStatusStyle(item.status);
                  const isSending = sending === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-card-hover transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* 左側: タイトル・情報 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="text-sm text-text-secondary truncate mt-1">
                              {item.subtitle}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {/* ステータス */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                              {statusStyle.icon}
                              {item.status}
                            </span>
                            {/* 配信先 */}
                            {item.targets.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">
                                <Users className="w-3 h-3" />
                                {item.targets.join(', ')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                <Users className="w-3 h-3" />
                                すべて
                              </span>
                            )}
                            {/* 公開日 */}
                            {item.publishedAt && (
                              <span className="text-xs text-text-muted">
                                {item.publishedAt}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 右側: 送信ボタン */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => setConfirmModal(item)}
                            disabled={isSending}
                            className={`
                              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                              ${isSending
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : item.status === '送信済み'
                                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  : 'bg-accent text-white hover:bg-accent-dark'
                              }
                            `}
                          >
                            {isSending ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                送信中...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                {item.status === '送信済み' ? '再送信' : '送信'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 注意書き */}
          <div className="mt-6 p-4 bg-card rounded-lg">
            <div className="flex items-start gap-3 text-sm text-text-secondary">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-text-primary mb-1">送信前の確認事項</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Notionで「配信先」を設定してからお送りください</li>
                  <li>配信先が未設定の場合は「すべて」の顧客に送信されます</li>
                  <li>送信済みのニュースも再送信できます</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 確認モーダル */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4">
                ニュースレターを送信
              </h3>
              <div className="space-y-3 mb-6">
                <p className="text-text-primary">
                  「<span className="font-medium">{confirmModal.title}</span>」を送信しますか？
                </p>
                <div className="text-sm text-text-secondary">
                  <p>配信先: {confirmModal.targets.length > 0 ? confirmModal.targets.join(', ') : 'すべて'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleSend(confirmModal)}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  送信する
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* トースト通知 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`
              fixed bottom-6 right-6 max-w-sm p-4 rounded-lg shadow-lg z-50
              ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}
              text-white
            `}
          >
            <div className="flex items-start gap-3">
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
