'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Menu', href: '/menu', nameJa: 'メニュー' },
  { name: 'About', href: '/about', nameJa: '店舗情報' },
  { name: 'News', href: '/news', nameJa: 'お知らせ' },
  { name: 'Gallery', href: '/gallery', nameJa: 'ギャラリー' },
  { name: 'Products', href: '/products', nameJa: '商品紹介' },
];

const Header = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdminPath = pathname?.startsWith('/admin');

  // スクロールでヘッダー背景を切り替え
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // モバイルメニュー開閉時にスクロール固定
  useEffect(() => {
    document.body.style.overflowY = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflowY = '';
    };
  }, [mobileMenuOpen]);

  if (isAdminPath) {
    return null;
  }

  // モバイルメニューの項目：開くときだけ順に表示（閉じるときは一斉に消す）
  const menuItemClass = `transition-all duration-500 ${
    mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
  }`;
  const menuItemDelay = (seconds: number) => ({
    transitionDelay: mobileMenuOpen ? `${seconds}s` : '0s',
  });

  return (
    <>
      <header
        className={`header-enter fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-dark/95 backdrop-blur-md py-4 shadow-lg shadow-black/20'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="container-wide flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="relative z-50 group">
            <span className="text-2xl md:text-3xl font-serif tracking-[0.15em] text-white transition-colors duration-300">
              MONË
            </span>
            <span className="block text-[9px] tracking-[0.25em] text-text-muted uppercase mt-0.5">
              Men&apos;s Hair Salon
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:block">
            <ul className="flex items-center gap-10">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group relative transition-colors duration-300 ${
                      pathname === item.href
                        ? 'text-accent-light'
                        : 'text-text-secondary hover:text-white'
                    }`}
                  >
                    <span className="text-xs tracking-[0.2em] uppercase">
                      {item.name}
                    </span>
                    <span
                      className={`absolute -bottom-1 left-0 h-[1px] bg-gradient-to-r from-accent to-gold transition-all duration-300 ${
                        pathname === item.href ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/booking"
                  className="ml-4 px-6 py-3 bg-accent text-white text-xs tracking-[0.15em] uppercase transition-all duration-300 hover:bg-accent-light hover:shadow-lg hover:shadow-accent/30"
                >
                  ご予約
                </Link>
              </li>
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden relative z-50 w-10 h-10 flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="メニューを開く"
          >
            <div className="relative w-6 h-4">
              <span
                className={`absolute left-0 w-full h-[1px] bg-white transition-all duration-300 ${
                  mobileMenuOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-white transition-opacity duration-200 ${
                  mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 w-full h-[1px] bg-white transition-all duration-300 ${
                  mobileMenuOpen ? 'bottom-1/2 translate-y-1/2 -rotate-45' : 'bottom-0'
                }`}
              />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {/* 閉じるときもフェードアウトさせるため常に描画し、閉じている間は見えず触れない状態にする */}
      <div
        aria-hidden={!mobileMenuOpen}
        inert={!mobileMenuOpen}
        className={`fixed inset-0 z-40 bg-dark lg:hidden transition-[opacity,visibility] duration-300 ${
          mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
            {/* Decorative background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 right-0 w-[200px] h-[200px] rounded-full bg-accent opacity-5 blur-3xl translate-x-1/2" />
              <div className="absolute bottom-1/4 left-0 w-[200px] h-[200px] rounded-full bg-gold opacity-5 blur-3xl -translate-x-1/2" />
            </div>

            <nav className="relative h-full flex flex-col items-center justify-between pt-24 pb-8">
              <ul className="flex flex-col items-center gap-6">
                {navItems.map((item, index) => (
                  <li
                    key={item.name}
                    className={menuItemClass}
                    style={menuItemDelay(0.1 + index * 0.1)}
                  >
                    <Link
                      href={item.href}
                      className="group flex flex-col items-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="text-2xl font-serif text-white transition-colors duration-300 group-hover:text-accent-light">
                        {item.nameJa}
                      </span>
                      <span className="text-[10px] tracking-[0.3em] uppercase text-text-muted mt-1">
                        {item.name}
                      </span>
                    </Link>
                  </li>
                ))}
                <li className={menuItemClass} style={menuItemDelay(0.5)}>
                  <Link
                    href="/booking"
                    className="mt-2 px-8 py-4 bg-accent text-white text-sm tracking-[0.15em] uppercase"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    ご予約はこちら
                  </Link>
                </li>
              </ul>

              {/* Contact info */}
              <div
                className={`text-center transition-opacity duration-500 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                style={menuItemDelay(0.6)}
              >
                <p className="text-xs tracking-[0.2em] text-text-muted mb-2">
                  RESERVATION
                </p>
                <a
                  href="tel:06-6908-4859"
                  className="text-lg text-white font-light tracking-wider"
                >
                  06-6908-4859
                </a>
              </div>
            </nav>
      </div>
    </>
  );
};

export default Header;
