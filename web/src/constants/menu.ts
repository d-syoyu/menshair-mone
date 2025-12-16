// constants/menu.ts
// メニューカテゴリの配色定数（スタイリング用）
// メニューデータ自体はDBから取得

// カテゴリ別背景色
export const CATEGORY_COLORS: Record<string, string> = {
  "カット": "#8B7355",
  "カラー": "#9F86C0",
  "パーマ": "#E0B1CB",
  "縮毛矯正": "#F4A261",
  "スパ・トリートメント": "#2A9D8F",
  "シャンプー＆セット": "#98C1D9",
  "メンズシェービング": "#ADB5BD",
};

// カテゴリ別テキスト色（背景色に対するコントラスト）
export const CATEGORY_TEXT_COLORS: Record<string, string> = {
  "カット": "#FFFFFF",
  "カラー": "#FFFFFF",
  "パーマ": "#1F2937",
  "縮毛矯正": "#1F2937",
  "スパ・トリートメント": "#FFFFFF",
  "シャンプー＆セット": "#1F2937",
  "メンズシェービング": "#1F2937",
};

// カテゴリの表示用文字色を取得
export const getCategoryTextColor = (category: string): string => {
  return CATEGORY_TEXT_COLORS[category] || "#FFFFFF";
};

// 価格をフォーマット
export const formatPrice = (price: number): string => {
  return `¥${price.toLocaleString()}`;
};
