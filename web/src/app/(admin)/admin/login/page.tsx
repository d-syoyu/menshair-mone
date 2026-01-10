'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Shield } from 'lucide-react';

const STORAGE_KEY = 'admin_login_email';

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY) || '';
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // 管理者ログイン（Credentials）
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // メールアドレスを保存/削除
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, email);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    // redirect: false でリダイレクトを防ぎ、結果を手動で処理
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    console.log('[Admin Login Page] SignIn result:', result);

    if (result?.error) {
      // エラーの場合はここでハンドリング
      console.error('[Admin Login Page] SignIn error:', result.error);
      setIsLoading(false);
      window.location.replace('/admin/login?error=CredentialsSignin');
    } else if (result?.ok) {
      // 成功したら管理画面へ（キャッシュバスティング用のタイムスタンプを追加）
      console.log('[Admin Login Page] SignIn successful, redirecting to admin');
      window.location.replace(`/admin?t=${Date.now()}`);
    } else {
      console.warn('[Admin Login Page] SignIn returned unexpected result');
      setIsLoading(false);
    }
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-6">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <p className="text-sm tracking-wider text-gray-500 uppercase mb-2">Staff Only</p>
        <h1 className="text-3xl font-medium mb-4 text-gray-900">スタッフログイン</h1>
        <div className="w-12 h-px bg-gray-300 mx-auto mb-6" />
        <p className="text-gray-600 text-sm">
          管理者・スタッフ専用のログインページです
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6 text-sm">
          {error === 'CredentialsSignin'
            ? 'メールアドレスまたはパスワードが正しくありません'
            : 'ログインに失敗しました'}
        </div>
      )}

      {/* 管理者ログイン */}
      <form onSubmit={handleAdminLogin} className="space-y-6">
        <div>
          <label
            htmlFor="admin-email"
            className="block text-xs tracking-wider text-gray-600 uppercase mb-2"
          >
            メールアドレス
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="admin-password"
            className="block text-xs tracking-wider text-gray-600 uppercase mb-2"
          >
            パスワード
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* ログイン状態を保持 */}
        <div className="flex items-center gap-3">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="remember-me" className="text-sm text-gray-600">
            ログイン状態を保持する
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gray-800 text-white text-sm tracking-wider uppercase hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            'ログイン中...'
          ) : (
            <>
              ログイン
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* セッション情報 */}
      <p className="mt-6 text-center text-xs text-gray-500">
        ログイン後、90日間はログイン状態が保持されます
      </p>
    </motion.div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-32 pb-20">
      <div className="container-narrow">
        <Suspense
          fallback={
            <div className="max-w-md mx-auto text-center">
              <p className="text-gray-500">読み込み中...</p>
            </div>
          }
        >
          <AdminLoginContent />
        </Suspense>
      </div>
    </div>
  );
}
