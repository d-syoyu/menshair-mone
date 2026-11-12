'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

// 画面に入ったら中の data-reveal 要素を順にフェードインさせるセクション。
// 以前は Framer Motion（AnimatedSection + variants）で行っていたが、ページ全体を
// クライアント部品にする必要があり JS が重かった。中身はサーバー部品のまま渡し、
// ここでは「見えたか」だけを data-revealed に反映する。動きは globals.css の [data-reveal]。
export function RevealSection({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (!target || revealed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: '-100px 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [revealed]);

  return (
    <section ref={ref} className={`reveal-section ${className}`} data-revealed={revealed}>
      {children}
    </section>
  );
}
