'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { revealOrder } from '@/components/reveal-order';

// 地図は画面に近づいてから iframe を読み込む（Google への接続を初期表示から外す）
export default function LazyGoogleMapCard({ revealIndex }: { revealIndex: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);

  useEffect(() => {
    const target = containerRef.current;
    if (!target || shouldLoadMap) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [shouldLoadMap]);

  return (
    <div
      ref={containerRef}
      data-reveal="up"
      style={revealOrder(revealIndex)}
      className="relative w-full aspect-square lg:aspect-[4/3] glass-card overflow-hidden"
    >
      {shouldLoadMap ? (
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3278.4479374057114!2d135.56415047574637!3d34.744307472904254!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6000e163c999dd39%3A0xe6cfa343e4fc5f48!2smen's%20hair%20MONE!5e0!3m2!1sja!2sjp!4v1789968354329!5m2!1sja!2sjp"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          title="Men's hair MONEのGoogleマップ"
          className="absolute inset-0 grayscale-[30%] contrast-[1.1]"
        />
      ) : (
        <>
          <Image
            src="/entrance.jpeg"
            alt="MONË 店舗外観"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        </>
      )}

      <div className="absolute right-4 bottom-4">
        <a
          href="https://www.google.com/maps/search/?api=1&query=men's+hair+MONE+大阪府守口市八雲中町1-24-1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-dark/90 border border-glass-border text-white text-sm transition-all duration-300 hover:bg-accent hover:border-accent backdrop-blur-sm"
        >
          <MapPin className="w-4 h-4" />
          <span className="text-xs tracking-[0.1em]">大きな地図で見る</span>
        </a>
      </div>
    </div>
  );
}
