'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: '設定エラー',
    description: 'サーバーの設定に問題があります。しばらくしてから再度お試しください。',
  },
  AccessDenied: {
    title: 'アクセス拒否',
    description: 'このアカウントではアクセスできません。',
  },
  Verification: {
    title: '認証リンクが無効です',
    description: 'リンクの有効期限が切れているか、既に使用されています。再度ログインをお試しください。',
  },
  Default: {
    title: 'エラーが発生しました',
    description: 'ログイン処理中にエラーが発生しました。再度お試しください。',
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';

  const errorInfo = ERROR_MESSAGES[error] || ERROR_MESSAGES.Default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-md mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-subheading mb-2">Error</p>
        <h1 className="text-heading text-white mb-4">{errorInfo.title}</h1>
        <div className="divider-line mx-auto" />
      </div>

      {/* Content */}
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>

        <p className="text-text-secondary text-sm leading-relaxed mb-8">
          {errorInfo.description}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/login"
            className="btn-primary w-full justify-center"
          >
            <RefreshCw className="w-4 h-4" />
            再度ログインする
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            トップページに戻る
          </Link>
        </div>
      </div>

      {/* Help */}
      <p className="mt-6 text-center text-xs text-text-muted">
        問題が解決しない場合は、お電話（06-6908-4859）でお問い合わせください
      </p>
    </motion.div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-dark pt-32 pb-20">
      <div className="container-narrow">
        <Suspense
          fallback={
            <div className="max-w-md mx-auto text-center">
              <p className="text-text-muted">読み込み中...</p>
            </div>
          }
        >
          <AuthErrorContent />
        </Suspense>
      </div>
    </div>
  );
}
