'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Suspense, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogIn, ArrowLeft, Shield, Loader2 } from 'lucide-react';

function VerifyLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl');

  const handleVerify = useCallback(() => {
    if (!callbackUrl) return;

    // callbackUrlが自サイトのauth callbackであることを検証
    try {
      const url = new URL(callbackUrl);
      const isValid =
        url.pathname.startsWith('/api/auth/callback/') &&
        (url.host === 'www.mone.hair' ||
          url.host === 'localhost:3000' ||
          url.host.endsWith('.vercel.app'));

      if (!isValid) return;
    } catch {
      return;
    }

    setIsLoading(true);
    router.push(callbackUrl);
  }, [callbackUrl, router]);

  if (!callbackUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto"
      >
        <div className="text-center mb-10">
          <p className="text-subheading mb-2">Error</p>
          <h1 className="text-heading text-white mb-4">無効なリンクです</h1>
          <div className="divider-line mx-auto" />
        </div>

        <div className="glass-card p-8 text-center">
          <p className="text-text-secondary text-sm leading-relaxed mb-8">
            認証リンクが正しくありません。<br />
            再度ログインをお試しください。
          </p>
          <Link
            href="/login"
            className="btn-primary w-full justify-center"
          >
            ログイン画面へ
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-md mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-subheading mb-2">Verification</p>
        <h1 className="text-heading text-white mb-4">ログイン認証</h1>
        <div className="divider-line mx-auto" />
      </div>

      {/* Content */}
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-light/20 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-light" />
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-white text-lg">
            ログインを完了してください
          </p>
          <p className="text-text-secondary text-sm leading-relaxed">
            下のボタンをタップして<br />
            ログインを完了します。
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={isLoading}
          className="btn-primary w-full justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              認証中...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              ログインする
            </>
          )}
        </button>
      </div>

      {/* Back Link */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ログイン画面に戻る
        </Link>
      </div>
    </motion.div>
  );
}

export default function VerifyLoginPage() {
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
          <VerifyLoginContent />
        </Suspense>
      </div>
    </div>
  );
}
