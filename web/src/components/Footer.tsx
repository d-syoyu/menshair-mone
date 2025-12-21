'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Instagram, MapPin, Phone, Clock } from 'lucide-react';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const Footer = () => {
  const pathname = usePathname();
  const [closedDaysText, setClosedDaysText] = useState('毎週月曜日（不定休あり）');

  useEffect(() => {
    const fetchClosedDays = async () => {
      try {
        const now = new Date();
        const res = await fetch(`/api/holidays?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
        const data = await res.json();
        const closedDays: number[] = data.closedDays || [1];
        if (closedDays.length === 0) {
          setClosedDaysText('不定休');
        } else {
          const dayNames = closedDays.map(d => WEEKDAYS[d]).join('・');
          setClosedDaysText(`毎週${dayNames}曜日（不定休あり）`);
        }
      } catch (error) {
        console.error('Failed to fetch closed days:', error);
      }
    };
    fetchClosedDays();
  }, []);

  // 管理画面では表示しない
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-dark-gray relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-accent opacity-[0.02] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-gold opacity-[0.02] blur-3xl" />
      </div>

      {/* Main Footer */}
      <div className="container-wide py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <span className="text-3xl font-serif tracking-[0.15em] text-white">
                MONË
              </span>
              <span className="block text-[9px] tracking-[0.25em] text-text-muted uppercase mt-1">
                Men&apos;s Hair Salon
              </span>
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              一人一人の男性に<br />
              「光」と「印象」を...
            </p>
            {/* Social */}
            <div className="flex gap-4">
              <a
                href="https://instagram.com/barber_shop0601mone"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border border-glass-border flex items-center justify-center transition-all duration-300 hover:border-accent hover:text-accent"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-accent-light mb-6">
              Navigation
            </h4>
            <ul className="space-y-4">
              {[
                { name: 'ホーム', href: '/' },
                { name: 'メニュー・料金', href: '/menu' },
                { name: '店舗情報', href: '/about' },
                { name: 'お知らせ', href: '/news' },
                { name: 'ご予約', href: '/booking' },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-text-secondary text-sm transition-colors duration-300 hover:text-white hover:pl-2"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Menu */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-accent-light mb-6">
              Menu
            </h4>
            <ul className="space-y-4">
              {[
                { name: 'カット', price: '¥4,950〜' },
                { name: 'シェービング', price: '¥2,200〜' },
                { name: 'ヘッドスパ', price: '¥2,200〜' },
                { name: 'カラー', price: '¥4,950〜' },
                { name: 'パーマ', price: '¥4,400〜' },
              ].map((item) => (
                <li key={item.name} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{item.name}</span>
                  <span className="text-text-muted">{item.price}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-accent-light mb-6">
              Access
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-accent-light mt-0.5 flex-shrink-0" />
                <span className="text-text-secondary">
                  〒570-0036<br />
                  大阪府守口市八雲中町1-24-1
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-accent-light flex-shrink-0" />
                <a
                  href="tel:06-6908-4859"
                  className="text-text-secondary transition-colors duration-300 hover:text-white"
                >
                  06-6908-4859
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Instagram className="w-4 h-4 text-accent-light flex-shrink-0" />
                <a
                  href="https://instagram.com/barber_shop0601mone"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary transition-colors duration-300 hover:text-white"
                >
                  @barber_shop0601mone
                </a>
              </li>
            </ul>

            {/* Hours */}
            <div className="mt-6 pt-6 border-t border-glass-border">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-4 h-4 text-accent-light" />
                <p className="text-xs tracking-[0.15em] uppercase text-text-muted">Hours</p>
              </div>
              <div className="text-sm text-text-secondary space-y-2">
                <div>
                  <p>平日 10:00 - 21:00</p>
                  <p className="text-xs text-text-muted">（受付20:00まで）</p>
                </div>
                <div>
                  <p>土日祝 10:00 - 20:30</p>
                  <p className="text-xs text-text-muted">（受付19:30まで）</p>
                </div>
                <p className="text-text-muted">定休日: {closedDaysText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="border-t border-glass-border">
        <div className="container-wide py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-xs tracking-[0.2em] text-text-muted uppercase mb-1">Reservation</p>
              <p className="text-text-secondary text-sm">ご予約・お問い合わせはInstagram DMまたはお電話で</p>
            </div>
            <Link
              href="/booking"
              className="btn-primary"
            >
              Web予約する
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-glass-border">
        <div className="container-wide py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-text-muted tracking-wider">
            &copy; {new Date().getFullYear()} MONË. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-text-muted">
            <Link href="/privacy" className="transition-colors duration-300 hover:text-text-secondary">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="transition-colors duration-300 hover:text-text-secondary">
              利用規約
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
