'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle, User, Phone } from 'lucide-react';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');

  // 登録処理
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // まずAPIでユーザー情報を登録
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '登録に失敗しました');
        setIsLoading(false);
        return;
      }

      // マジックリンクを送信
      await signIn('resend', { email, callbackUrl: '/mypage' });
      setIsEmailSent(true);
    } catch {
      setError('登録に失敗しました。しばらく経ってからお試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-dark pt-32 pb-20">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-heading text-white mb-4">メールを送信しました</h1>
            <div className="divider-line mx-auto mb-6" />
            <p className="text-text-secondary mb-8">
              <strong className="text-white">{email}</strong> 宛に登録リンクを送信しました。<br />
              メールをご確認ください。
            </p>
            <p className="text-sm text-text-muted">
              メールが届かない場合は、迷惑メールフォルダをご確認ください。
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

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
            <p className="text-subheading mb-2">Sign Up</p>
            <h1 className="text-heading text-white mb-4">新規登録</h1>
            <div className="divider-line mx-auto mb-6" />
            <p className="text-text-secondary text-sm">
              アカウントを作成して<br />
              オンラインでご予約いただけます
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs tracking-wider text-text-muted uppercase mb-2"
                >
                  お名前 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="山田 太郎"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-glass-border rounded bg-dark-lighter text-white placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs tracking-wider text-text-muted uppercase mb-2"
                >
                  電話番号 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="090-1234-5678"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-glass-border rounded bg-dark-lighter text-white placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs tracking-wider text-text-muted uppercase mb-2"
                >
                  メールアドレス <span className="text-red-400">*</span>
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

              <button
                type="submit"
                disabled={isLoading || !name || !phone || !email}
                className="w-full flex items-center justify-center gap-2 py-4 bg-accent text-white text-sm tracking-wider uppercase hover:bg-accent-light transition-colors disabled:opacity-50 rounded"
              >
                {isLoading ? (
                  '登録中...'
                ) : (
                  <>
                    登録する
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Terms */}
            <p className="text-xs text-center text-text-muted">
              登録により、
              <Link href="/terms" className="text-accent-light hover:text-white">
                利用規約
              </Link>
              および
              <Link href="/privacy" className="text-accent-light hover:text-white">
                プライバシーポリシー
              </Link>
              に同意したものとみなされます。
            </p>

            <div className="pt-4 border-t border-glass-border">
              <p className="text-center text-sm text-text-secondary">
                すでにアカウントをお持ちの方は
                <Link href="/login" className="text-accent-light hover:text-white ml-1">
                  ログイン
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
