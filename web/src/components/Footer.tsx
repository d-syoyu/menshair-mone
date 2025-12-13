import Link from 'next/link';
import { Instagram, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[var(--color-charcoal)] text-white">
      {/* Main Footer */}
      <div className="container-wide py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <span className="text-2xl font-[family-name:var(--font-serif)] tracking-[0.15em] text-white">
                LUMINA
              </span>
              <span className="block text-[10px] tracking-[0.3em] text-gray-400 uppercase">
                HAIR STUDIO
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              自然由来の成分と熟練の技術で<br />
              あなたの美しさを引き出します
            </p>
            {/* Social */}
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border border-gray-600 flex items-center justify-center transition-all duration-300 hover:border-[var(--color-sage)] hover:text-[var(--color-sage)]"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-[var(--color-gold)] mb-6">
              Navigation
            </h4>
            <ul className="space-y-4">
              {[
                { name: 'ホーム', href: '/' },
                { name: 'メニュー', href: '/menu' },
                { name: 'スタッフ', href: '/staff' },
                { name: 'ブログ', href: '/blog' },
                { name: 'ご予約・お問い合わせ', href: '/contact' },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 text-sm transition-colors duration-300 hover:text-white"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Menu */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-[var(--color-gold)] mb-6">
              Menu
            </h4>
            <ul className="space-y-4">
              {[
                { name: 'カット', price: '¥5,500〜' },
                { name: 'カラー', price: '¥6,600〜' },
                { name: 'パーマ', price: '¥8,800〜' },
                { name: '縮毛矯正', price: '¥17,600〜' },
                { name: '髪質改善', price: '¥11,000〜' },
              ].map((item) => (
                <li key={item.name} className="flex justify-between text-sm">
                  <span className="text-gray-400">{item.name}</span>
                  <span className="text-gray-500">{item.price}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-[var(--color-gold)] mb-6">
              Contact
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-[var(--color-sage)] mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">
                  東京都渋谷区神宮前1-2-3<br />
                  表参道駅 A1出口より徒歩3分
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-[var(--color-sage)] flex-shrink-0" />
                <a
                  href="tel:03-1234-5678"
                  className="text-gray-400 transition-colors duration-300 hover:text-white"
                >
                  03-1234-5678
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-[var(--color-sage)] flex-shrink-0" />
                <a
                  href="mailto:info@lumina-hair.jp"
                  className="text-gray-400 transition-colors duration-300 hover:text-white"
                >
                  info@lumina-hair.jp
                </a>
              </li>
            </ul>

            {/* Hours */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-xs tracking-[0.15em] uppercase text-gray-500 mb-3">Hours</p>
              <div className="text-sm text-gray-400 space-y-1">
                <p>平日 10:00 - 20:00</p>
                <p>土日祝 9:00 - 19:00</p>
                <p className="text-gray-500">定休日: 毎週火曜日</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-wide py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 tracking-wider">
            &copy; {new Date().getFullYear()} LUMINA HAIR STUDIO. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-gray-500">
            <Link href="/privacy" className="transition-colors duration-300 hover:text-gray-300">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="transition-colors duration-300 hover:text-gray-300">
              利用規約
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
