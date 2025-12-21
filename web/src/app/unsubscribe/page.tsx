'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MailX, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  // 成功時
  if (success === 'true') {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-accent" />
        </div>

        <h2 className="text-xl text-white mb-4">配信停止が完了しました</h2>

        <p className="text-text-secondary text-sm mb-8">
          ニュースレターの配信を停止しました。<br />
          ご利用いただきありがとうございました。
        </p>

        <p className="text-text-muted text-xs mb-6">
          配信を再開したい場合は、マイページの設定から変更できます。
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          トップページに戻る
        </Link>
      </div>
    );
  }

  // エラー時
  if (error) {
    const errorMessages: Record<string, string> = {
      invalid: '無効なリクエストです。リンクが正しいかご確認ください。',
      server: '処理中にエラーが発生しました。しばらくしてから再度お試しください。',
    };

    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>

        <h2 className="text-xl text-white mb-4">エラーが発生しました</h2>

        <p className="text-text-secondary text-sm mb-8">
          {errorMessages[error] || '不明なエラーが発生しました。'}
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          トップページに戻る
        </Link>
      </div>
    );
  }

  // 初期状態（リンクから直接アクセスした場合）
  return (
    <div className="glass-card p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
        <MailX className="w-8 h-8 text-accent" />
      </div>

      <h2 className="text-xl text-white mb-4">配信停止</h2>

      <p className="text-text-secondary text-sm mb-8">
        ニュースレターの配信停止をご希望の場合は、<br />
        メール内のリンクからお手続きください。
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        トップページに戻る
      </Link>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-dark pt-32 pb-20">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-subheading mb-2">Newsletter</p>
            <h1 className="text-heading text-white mb-4">配信設定</h1>
            <div className="divider-line mx-auto" />
          </div>

          {/* Content */}
          <Suspense fallback={
            <div className="glass-card p-8 text-center">
              <p className="text-text-secondary">読み込み中...</p>
            </div>
          }>
            <UnsubscribeContent />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
