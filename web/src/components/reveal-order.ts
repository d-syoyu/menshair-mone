import type { CSSProperties } from 'react';

/** RevealSection 内で何番目に表示するか（0.15秒ずつ遅らせる）。サーバー部品からも使う */
export function revealOrder(index: number): CSSProperties {
  return { '--reveal-index': index } as CSSProperties;
}
