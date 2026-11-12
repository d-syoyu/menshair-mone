'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

// ヒーロー背景のスライド（Ken Burns でローテーション）
// 1枚目は LCP 画像として priority で即読み込み。2・3枚目は表示されるまで約8秒あるため、
// ページ読み込み完了後（アイドル時）に読み込み、1枚目の帯域と競合させない。
// アニメーション（globals.css の ken-burns-*）はラッパーに付け、最初からマウントしておくので
// 3枚のタイムラインは常に同期する。
const SLIDES = [
  { src: '/image1.webp', className: 'ken-burns-1' },
  { src: '/image2.webp', className: 'ken-burns-2' },
  { src: '/image3.webp', className: 'ken-burns-3' },
] as const;

export default function HeroBackground() {
  const [loadRest, setLoadRest] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(() => setLoadRest(true), { timeout: 3000 });
      } else {
        timeoutId = setTimeout(() => setLoadRest(true), 1500);
      }
    };

    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }

    return () => {
      window.removeEventListener('load', schedule);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      {SLIDES.map((slide, index) => {
        const isFirst = index === 0;
        return (
          <div key={slide.src} className={`hero-slide absolute inset-0 ${slide.className}`}>
            {(isFirst || loadRest) && (
              <Image
                src={slide.src}
                alt=""
                fill
                priority={isFirst}
                // 2・3枚目はマウント自体を遅らせているので、ブラウザの遅延読み込みは不要
                loading={isFirst ? undefined : 'eager'}
                fetchPriority={isFirst ? 'high' : 'low'}
                sizes="100vw"
                className="object-cover"
              />
            )}
          </div>
        );
      })}
    </>
  );
}
