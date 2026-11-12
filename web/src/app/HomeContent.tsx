import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, MapPin, Calendar, Phone } from 'lucide-react';
import type { HomeNewsItem } from '@/lib/home-news';
import { RevealSection } from '@/components/RevealSection';
import { revealOrder } from '@/components/reveal-order';
import HeroBackground from './HeroBackground';
import LazyGoogleMapCard from './LazyGoogleMapCard';

// メニューデータ
const featuredMenus = [
  {
    title: 'Cut',
    titleJa: 'カット',
    price: '¥4,950〜',
    description: '骨格や髪質を見極め、大人の男性に相応しいスタイルをご提案',
  },
  {
    title: 'Shaving',
    titleJa: 'シェービング',
    price: '¥2,200〜',
    description: '産毛や古い角質を除去し、肌本来の明るさ滑らかさを引き出す最高のスキンケア',
  },
  {
    title: 'Head Spa',
    titleJa: 'ヘッドスパ',
    price: '¥2,200〜',
    description: '頭皮の血行を促進し、日々の疲れを癒す極上のリラクゼーション',
  },
  {
    title: 'Color',
    titleJa: 'カラー',
    price: '¥4,950〜',
    description: '白髪染めからおしゃれ染めまで、あなたに合った色味をご提案',
  },
];


interface HomeContentProps {
  initialNewsItems: HomeNewsItem[];
  closedDaysText: string;
}

// トップページの本体。サーバー部品として描画し、ブラウザで動くのは
// ヒーロー画像（HeroBackground）・地図（LazyGoogleMapCard）・表示アニメーション（RevealSection）だけ。
export default function HomeContent({ initialNewsItems, closedDaysText }: HomeContentProps) {
  const newsItems = initialNewsItems;

  return (
    <div className="min-h-screen overflow-x-clip">

      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-screen md:h-screen flex items-center justify-center overflow-hidden overflow-x-clip pt-24 pb-12 md:pt-0 md:pb-0">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden overflow-x-clip">
          <HeroBackground />

          {/* Overlay for text readability - darker for white background areas, stronger on mobile */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/60 to-black/70 md:from-black/55 md:via-black/50 md:to-black/60" />

          {/* Accent glow effects - contained within viewport */}
          <div className="absolute top-1/4 left-[10%] w-[200px] md:w-[400px] h-[200px] md:h-[400px] rounded-full bg-accent-light opacity-[0.06] blur-[80px] md:blur-[100px]" />
          <div className="absolute bottom-1/3 right-[10%] w-[150px] md:w-[300px] h-[150px] md:h-[300px] rounded-full bg-gold opacity-[0.04] blur-[60px] md:blur-[80px]" />

          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
        </div>

        <div className="relative z-10 text-center px-6">
          <p
            className="text-subheading mb-4 md:mb-8"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)', color: '#FFFFFF' }}
          >
            Men&apos;s Private Salon
          </p>

          <h1
            className="mb-6 md:mb-8 hero-enter hero-enter-delay-1"
          >
            <span className="text-display block mb-2 md:mb-4">
              一人一人の男性に
            </span>
            <span className="text-display block">
              <span className="hero-glow-quote">「</span><span className="text-gold hero-glow-main">光</span><span className="hero-glow-quote">」</span>と<span className="hero-glow-quote">「</span><span className="text-accent hero-glow-main">印象</span><span className="hero-glow-quote">」</span>を...
            </span>
          </h1>

          <div className="divider-line mx-auto mb-6 md:mb-8 hero-divider-enter" />

          <p
            className="text-text-secondary max-w-lg mx-auto mb-8 md:mb-12 text-body hero-enter hero-enter-delay-2"
          >
            守口市のメンズ専門プライベートサロン<br />
            大人の男性に上質な休息をご提供します
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center hero-enter hero-enter-delay-3"
          >
            <Link href="/booking" className="btn-primary">
              ご予約はこちら
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/menu" className="btn-outline">
              メニューを見る
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:block hero-enter hero-enter-delay-3">
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <span className="text-[10px] tracking-[0.3em] text-text-muted uppercase">Scroll</span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-text-muted to-transparent" />
          </div>
        </div>
      </section>

      {/* Concept Section */}
      <RevealSection className="py-16 md:py-32 lg:py-40 section-gradient overflow-hidden">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 lg:gap-24 items-center">
            {/* Decorative Element */}
            <div data-reveal="up" style={revealOrder(0)} className="relative">
              <div className="relative aspect-[4/5] glass-card overflow-hidden">
                <Image
                  src="/entrance.webp"
                  alt="MONË店舗入口"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              {/* Decorative frame - hidden on mobile to prevent overflow */}
              <div className="hidden md:block absolute -bottom-4 -right-4 w-full h-full border border-accent/30 -z-10" />
              <div className="hidden md:block absolute -bottom-8 -right-8 w-full h-full border border-gold/20 -z-20" />
            </div>

            {/* Content */}
            <div className="lg:pl-8">
              <p data-reveal="up" style={revealOrder(1)} className="text-subheading mb-4">
                Concept
              </p>
              <h2 data-reveal="up" style={revealOrder(2)} className="text-heading mb-8">
                上質な休息を、<br />
                <span className="text-accent-light">あなたに。</span>
              </h2>
              <div data-reveal="up" style={revealOrder(3)} className="divider-line mb-8" />
              <p data-reveal="up" style={revealOrder(4)} className="text-body mb-6">
                柔らかな「光」が差すプライベート空間で
                一人のスタッフが最初から最後まで丁寧にお客様と向き合い、
                大人の男性に相応しい凜とした「印象」と
                「光」のような清潔感をご提供致します。
              </p>
              <p data-reveal="up" style={revealOrder(5)} className="text-body mb-10">
                日々忙しい大人の男性にカット、シェービング、ヘッドスパなど
                様々なメニューを通じ「上質な休息」をご提供します。
              </p>
              <div data-reveal="up" style={revealOrder(6)}>
                <Link href="/about" className="btn-ghost group">
                  <span className="border-b border-text-muted pb-1 group-hover:border-accent transition-colors">
                    店舗情報を見る
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Menu Section */}
      <RevealSection className="py-16 md:py-32 section-dark overflow-hidden">
        <div className="container-wide relative z-10">
          <div className="text-center mb-20">
            <p data-reveal="up" style={revealOrder(0)} className="text-subheading mb-4">
              Menu
            </p>
            <h2 data-reveal="up" style={revealOrder(1)} className="text-heading mb-6">
              メニュー
            </h2>
            <div data-reveal="up" style={revealOrder(2)} className="divider-line-long mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {featuredMenus.map((menu, i) => (
              <div
                key={menu.title}
                data-reveal="up"
                style={revealOrder(3 + i)}
                className="menu-card flex flex-col"
              >
                <div className="mb-4">
                <p className="text-xs tracking-[0.2em] text-accent-light uppercase mb-1">
                  {menu.title}
                </p>
                <h3 className="text-2xl font-serif">
                  {menu.titleJa}
                </h3>
              </div>
                <p className="text-body flex-grow">
                  {menu.description}
                </p>
                <div className="pt-4 border-t border-glass-border mt-auto">
                  {menu.title === 'Shaving' ? (
                    <span className="text-xl font-light whitespace-nowrap">
                      <span className="text-gold">{menu.price}</span>
                      <span className="text-white">(単品価格)</span>
                    </span>
                  ) : (
                    <span className="text-xl font-light whitespace-nowrap text-gold">
                      {menu.price}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div data-reveal="up" style={revealOrder(7)} className="text-center mt-16">
            <Link href="/menu" className="btn-primary">
              全てのメニューを見る
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </RevealSection>

      {/* News Section */}
      <RevealSection className="py-16 md:py-32 section-gradient overflow-hidden">
        <div className="container-narrow">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12">
            <div>
              <p data-reveal="up" style={revealOrder(0)} className="text-subheading mb-4">
                News
              </p>
              <h2 data-reveal="up" style={revealOrder(1)} className="text-heading">
                お知らせ
              </h2>
            </div>
            <div data-reveal="fade" style={revealOrder(2)} className="mt-6 md:mt-0">
              <Link href="/news" className="btn-ghost group">
                <span>一覧を見る</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div data-reveal="up" style={revealOrder(3)} className="divider-line-long mb-8" />

          <div className="space-y-0">
            {newsItems.length > 0 ? (
              newsItems.map((news, i) => (
                <div
                  key={news.id}
                  data-reveal="up"
                  style={revealOrder(4 + i)}
                  className="news-card group cursor-pointer"
                >
                  <Link href={`/news/${news.slug}`} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                    <span className="text-sm text-text-muted font-light tracking-wider">
                      {news.publishedAt}
                    </span>
                    <span className="text-text-secondary group-hover:text-white transition-colors">
                      {news.title}
                    </span>
                  </Link>
                </div>
              ))
            ) : (
              <p data-reveal="up" style={revealOrder(4)} className="text-text-muted text-center py-8">
                お知らせはありません
              </p>
            )}
          </div>
        </div>
      </RevealSection>

      {/* Access Section */}
      <RevealSection className="py-16 md:py-32 section-dark overflow-hidden">
        <div className="container-wide relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <p data-reveal="up" style={revealOrder(0)} className="text-subheading mb-4">
                Access
              </p>
              <h2 data-reveal="up" style={revealOrder(1)} className="text-heading mb-8">
                アクセス
              </h2>
              <div data-reveal="up" style={revealOrder(2)} className="divider-line mb-10" />

              <div data-reveal="up" style={revealOrder(3)} className="space-y-8">
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-text-muted mb-2">Salon</p>
                  <p className="text-2xl font-serif text-white">MONË</p>
                  <p className="mt-1 text-sm tracking-[0.16em] text-text-secondary">
                    Men&apos;s hair MONE
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-accent-light mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-text-muted mb-2">Address</p>
                    <p className="text-lg text-text-secondary">
                      〒570-0036<br />
                      大阪府守口市八雲中町1-24-1
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-5 h-5 text-accent-light mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-text-muted mb-2">Tel</p>
                    <a
                      href="tel:06-6908-4859"
                      className="text-lg text-text-secondary transition-colors hover:text-white"
                    >
                      06-6908-4859
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-accent-light mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-text-muted mb-2">Hours</p>
                    <div className="space-y-2">
                      <div className="text-text-secondary">
                        <div className="flex justify-between max-w-xs">
                          <span>平日</span>
                          <span>10:00 - 21:00</span>
                        </div>
                        <p className="text-xs text-text-muted mt-1">（受付20:00まで）</p>
                      </div>
                      <div className="text-text-secondary">
                        <div className="flex justify-between max-w-xs">
                          <span>土日祝</span>
                          <span>9:00 - 20:30</span>
                        </div>
                        <p className="text-xs text-text-muted mt-1">（受付19:30まで）</p>
                      </div>
                      <p className="text-sm text-text-muted mt-2">定休日: {closedDaysText}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Calendar className="w-5 h-5 text-accent-light mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.2em] uppercase text-text-muted mb-2">Reservation</p>
                    <p className="text-text-secondary">完全予約制</p>
                  </div>
                </div>
              </div>

              <div data-reveal="up" style={revealOrder(4)} className="mt-12">
                <Link
                  href="/about"
                  className="btn-outline"
                >
                  店舗情報を見る
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <LazyGoogleMapCard revealIndex={5} />
          </div>
        </div>
      </RevealSection>

      {/* CTA Section */}
      <RevealSection className="py-16 md:py-32 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-dark-gray via-dark to-dark-gray" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent opacity-[0.02] blur-[150px]" />
        </div>

        <div className="container-narrow relative z-10 text-center">
          <p data-reveal="up" style={revealOrder(0)} className="text-subheading mb-4">
            Reservation
          </p>
          <h2 data-reveal="up" style={revealOrder(1)} className="text-[clamp(1.3rem,4vw,2.75rem)] font-light leading-tight mb-6 whitespace-nowrap">
            ご予約をお待ちしております
          </h2>
          <div data-reveal="up" style={revealOrder(2)} className="divider-line mx-auto mb-8" />
          <p data-reveal="up" style={revealOrder(3)} className="text-body max-w-lg mx-auto mb-12">
            当サロンは完全予約制となっております。<br />
            お電話またはWebからご予約ください。
          </p>
          <div data-reveal="up" style={revealOrder(4)} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking" className="btn-primary">
              Web予約する
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="tel:06-6908-4859" className="btn-outline">
              06-6908-4859
            </a>
          </div>
        </div>
      </RevealSection>

    </div>
  );
}
