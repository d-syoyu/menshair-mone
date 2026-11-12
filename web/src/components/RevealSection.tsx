'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type RevealTag = 'section' | 'div' | 'article';

// 画面に入ったら中の data-reveal 要素を順にフェードインさせるセクション。
// 以前は Framer Motion（AnimatedSection + variants）で行っていたが、ページ全体を
// クライアント部品にする必要があり JS が重かった。中身はサーバー部品のまま渡し、
// ここでは「見えたか」だけを data-revealed に反映する。動きは globals.css の [data-reveal]。
// self を付けると、この要素自体が data-reveal になる（一覧の1件ずつを個別に出したいとき）。
//
// 判定範囲は「画面の下端から bottomOffset px 上」より上のすべて。画面より上にある要素も
// 表示済みとして扱う。こうしないと「もっと見る」のスクロールや戻る操作で一気に飛ばされた要素が、
// 一度も画面と交差しないまま透明で残ってしまう。
export function RevealSection({
  children,
  className = '',
  as: Tag = 'section',
  self = false,
  bottomOffset = 100,
  style,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  as?: RevealTag;
  self?: boolean | 'up' | 'fade';
  bottomOffset?: number;
  style?: CSSProperties;
  onClick?: () => void;
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
      { rootMargin: `100000px 0px -${bottomOffset}px 0px` }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [revealed, bottomOffset]);

  return (
    <Tag
      ref={ref as never}
      className={`reveal-section ${className}`}
      data-revealed={revealed}
      data-reveal={self ? (self === true ? 'up' : self) : undefined}
      style={style}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
