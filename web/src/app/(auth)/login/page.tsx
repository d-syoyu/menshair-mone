'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'customer_login_email';

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/mypage';
  const error = searchParams.get('error');

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY) || '';
  });
  const [rememberEmail, setRememberEmail] = useState(true);

  // Email マジックリンク
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // メールアドレスを保存/削除
    if (rememberEmail) {
      localStorage.setItem(STORAGE_KEY, email);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    await signIn('resend', { email, callbackUrl });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-md mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-subheading mb-2">Account</p>
        <h1 className="text-heading text-white mb-4">アカウント</h1>
        <div className="divider-line mx-auto mb-6" />
        <p className="text-text-secondary text-sm">
          ご予約には会員登録が必要です
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-6 text-sm">
          {error === 'CredentialsSignin'
            ? 'メールアドレスまたはパスワードが正しくありません'
            : 'ログインに失敗しました'}
        </div>
      )}

      <div className="space-y-6">
        {/* 新規登録セクション - 優先表示 */}
        <div className="glass-card p-6 border-2 border-accent/30">
          <div className="text-center mb-6">
            <p className="text-xs tracking-[0.2em] text-accent-light uppercase mb-2">First Time</p>
            <h2 className="text-xl font-serif text-white mb-3">初めてご利用の方</h2>
            <p className="text-sm text-text-secondary">
              アカウントを作成してオンラインでご予約いただけます
            </p>
          </div>
          <Link href="/register" className="btn-primary w-full text-center">
            新規登録はこちら
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ログインセクション - 控えめ */}
        <div className="pt-4 border-t border-glass-border">
          <div className="text-center mb-6">
            <p className="text-xs tracking-[0.2em] text-text-muted uppercase mb-2">Login</p>
            <h2 className="text-lg text-text-secondary">すでにアカウントをお持ちの方</h2>
          </div>

          {/* Email Login */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs tracking-wider text-text-muted uppercase mb-2"
              >
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3 border border-glass-border rounded bg-dark-lighter text-white placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* メールアドレスを記憶 */}
            <div className="flex items-center gap-3">
              <input
                id="remember-email"
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                className="w-4 h-4 accent-accent bg-dark-lighter border-glass-border rounded"
              />
              <label htmlFor="remember-email" className="text-sm text-text-secondary">
                メールアドレスを記憶する
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full flex items-center justify-center gap-2 py-3 border border-glass-border text-text-secondary text-sm tracking-wider uppercase hover:border-accent hover:text-white transition-colors disabled:opacity-50 rounded"
            >
              {isLoading ? (
                'メール送信中...'
              ) : (
                <>
                  メールでログイン
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* セッション情報 */}
          <p className="mt-4 text-center text-xs text-text-muted">
            ログイン後、90日間はログイン状態が保持されます
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
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
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}
