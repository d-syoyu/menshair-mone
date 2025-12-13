'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { name: 'Menu', href: '/menu', nameJa: 'メニュー' },
  { name: 'Staff', href: '/staff', nameJa: 'スタッフ' },
  { name: 'Blog', href: '/blog', nameJa: 'ブログ' },
  { name: 'Contact', href: '/contact', nameJa: 'ご予約' },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[var(--color-cream)]/95 backdrop-blur-md py-4 shadow-sm'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="container-wide flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="relative z-50 group"
          >
            <span className="text-xl md:text-2xl font-[family-name:var(--font-serif)] tracking-[0.15em] text-[var(--color-charcoal)] transition-colors duration-300">
              LUMINA
            </span>
            <span className="block text-[10px] tracking-[0.3em] text-[var(--color-warm-gray)] uppercase">
              HAIR STUDIO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-10">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="group relative text-[var(--color-charcoal)] transition-colors duration-300 hover:text-[var(--color-sage-dark)]"
                  >
                    <span className="text-xs tracking-[0.2em] uppercase">
                      {item.name}
                    </span>
                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[var(--color-gold)] transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/contact"
                  className="ml-4 px-6 py-3 bg-[var(--color-charcoal)] text-white text-xs tracking-[0.15em] uppercase transition-all duration-300 hover:bg-[var(--color-sage-dark)]"
                >
                  予約する
                </Link>
              </li>
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden relative z-50 w-10 h-10 flex items-center justify-center"
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
                className="absolute left-0 w-full h-[1px] bg-[var(--color-charcoal)]"
              />
              <motion.span
                animate={{
                  opacity: mobileMenuOpen ? 0 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-[var(--color-charcoal)]"
              />
              <motion.span
                animate={{
                  bottom: mobileMenuOpen ? '50%' : '0%',
                  rotate: mobileMenuOpen ? -45 : 0,
                  translateY: mobileMenuOpen ? '50%' : '0%',
                }}
                transition={{ duration: 0.3 }}
                className="absolute left-0 bottom-0 w-full h-[1px] bg-[var(--color-charcoal)]"
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
            className="fixed inset-0 z-40 bg-[var(--color-cream)] md:hidden"
          >
            {/* Decorative background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 -right-20 w-[300px] h-[300px] rounded-full bg-[var(--color-sage-light)] opacity-10 blur-3xl" />
              <div className="absolute bottom-1/4 -left-20 w-[250px] h-[250px] rounded-full bg-[var(--color-gold-light)] opacity-10 blur-3xl" />
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
                      <span className="text-3xl font-[family-name:var(--font-serif)] text-[var(--color-charcoal)] transition-colors duration-300 group-hover:text-[var(--color-sage-dark)]">
                        {item.nameJa}
                      </span>
                      <span className="text-xs tracking-[0.3em] uppercase text-[var(--color-warm-gray)] mt-1">
                        {item.name}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              {/* Contact info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-12 text-center"
              >
                <p className="text-xs tracking-[0.2em] text-[var(--color-warm-gray)] mb-2">
                  RESERVATION
                </p>
                <a
                  href="tel:03-1234-5678"
                  className="text-lg text-[var(--color-charcoal)] font-light tracking-wider"
                >
                  03-1234-5678
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
