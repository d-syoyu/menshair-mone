'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function VerifyRequestPage() {
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
            <p className="text-subheading mb-2">Email Sent</p>
            <h1 className="text-heading text-white mb-4">メールを送信しました</h1>
            <div className="divider-line mx-auto" />
          </div>

          {/* Content */}
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-light/20 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-light" />
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-white text-lg">
                認証メールをお送りしました
              </p>
              <p className="text-text-secondary text-sm leading-relaxed">
                メールに記載されたリンクをクリックして<br />
                ログインを完了してください。
              </p>
            </div>

            {/* Tips */}
            <div className="bg-dark-lighter rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3 text-left">
                <CheckCircle className="w-5 h-5 text-light mt-0.5 flex-shrink-0" />
                <div className="text-sm text-text-secondary space-y-2">
                  <p>メールが届かない場合：</p>
                  <ul className="list-disc list-inside space-y-1 text-text-muted">
                    <li>迷惑メールフォルダをご確認ください</li>
                    <li>noreply@mone.hair からの受信を許可してください</li>
                    <li>数分経っても届かない場合は再度お試しください</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Back Link */}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              ログイン画面に戻る
            </Link>
          </div>

          {/* Session Info */}
          <p className="mt-6 text-center text-xs text-text-muted">
            リンクは24時間有効です
          </p>
        </motion.div>
      </div>
    </div>
  );
}
