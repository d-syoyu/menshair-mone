'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
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
              <motion.span
                animate={{
                  top: mobileMenuOpen ? '50%' : '0%',
                  rotate: mobileMenuOpen ? 45 : 0,
                  translateY: mobileMenuOpen ? '-50%' : '0%',
                }}
                transition={{ duration: 0.3 }}
                className="absolute left-0 w-full h-[1px] bg-white"
              />
              <motion.span
                animate={{
                  opacity: mobileMenuOpen ? 0 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-white"
              />
              <motion.span
                animate={{
                  bottom: mobileMenuOpen ? '50%' : '0%',
                  rotate: mobileMenuOpen ? -45 : 0,
                  translateY: mobileMenuOpen ? '50%' : '0%',
                }}
                transition={{ duration: 0.3 }}
                className="absolute left-0 bottom-0 w-full h-[1px] bg-white"
              />
            </div>
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-dark lg:hidden"
          >
            {/* Decorative background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 right-0 w-[200px] h-[200px] rounded-full bg-accent opacity-5 blur-3xl translate-x-1/2" />
              <div className="absolute bottom-1/4 left-0 w-[200px] h-[200px] rounded-full bg-gold opacity-5 blur-3xl -translate-x-1/2" />
            </div>

            <nav className="relative h-full flex flex-col items-center justify-center">
              <ul className="flex flex-col items-center gap-8">
                {navItems.map((item, index) => (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className="group flex flex-col items-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="text-3xl font-serif text-white transition-colors duration-300 group-hover:text-accent-light">
                        {item.nameJa}
                      </span>
                      <span className="text-xs tracking-[0.3em] uppercase text-text-muted mt-1">
                        {item.name}
                      </span>
                    </Link>
                  </motion.li>
                ))}
                <motion.li
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.5 }}
                >
                  <Link
                    href="/booking"
                    className="mt-4 px-8 py-4 bg-accent text-white text-sm tracking-[0.15em] uppercase"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    ご予約はこちら
                  </Link>
                </motion.li>
              </ul>

              {/* Contact info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-12 text-center"
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
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
