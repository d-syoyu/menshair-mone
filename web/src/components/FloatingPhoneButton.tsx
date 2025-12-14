'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Phone, User } from 'lucide-react';

const FloatingButtons = () => {
  const pathname = usePathname();

  // 管理画面では表示しない
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* 電話ボタン（左下） */}
      <a
        href="tel:06-6908-4859"
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-accent hover:bg-accent-light rounded-full flex items-center justify-center shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-110 group"
        aria-label="電話で予約する"
      >
        <Phone className="w-6 h-6 text-white group-hover:animate-pulse" />

        {/* ツールチップ */}
        <span className="absolute left-full ml-3 px-3 py-1.5 bg-dark-gray border border-glass-border text-white text-xs whitespace-nowrap rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          お電話でご予約
        </span>
      </a>

      {/* マイページボタン（右下） */}
      <Link
        href="/mypage"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-accent hover:bg-accent-light rounded-full flex items-center justify-center shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-110 group"
        aria-label="マイページ"
      >
        <User className="w-6 h-6 text-white group-hover:animate-pulse" />

        {/* ツールチップ */}
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-dark-gray border border-glass-border text-white text-xs whitespace-nowrap rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          マイページ
        </span>
      </Link>
    </>
  );
};

export default FloatingButtons;
