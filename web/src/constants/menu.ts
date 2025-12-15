// constants/menu.ts
// 予約・管理で共通利用するメニュー定義（DBと同値を維持）

export type MenuItem = {
  id: string;
  category: string;
  name: string;
  price: number;
  duration: number; // 所要時間（分）
  lastBookingTime: string; // 最終受付時間 "HH:MM"
};

export const MENU_CATEGORY_LIST = [
  { id: "カット", title: "Cut", color: "#8B7355" },
  { id: "カラー", title: "Color", color: "#9F86C0" },
  { id: "パーマ", title: "Perm", color: "#E0B1CB" },
  { id: "縮毛矯正", title: "Straight Perm", color: "#F4A261" },
  { id: "スパ・トリートメント", title: "Spa & Treatment", color: "#2A9D8F" },
  { id: "シャンプー＆セット", title: "Shampoo & Set", color: "#98C1D9" },
  { id: "メンズシェービング", title: "Men's SV", color: "#ADB5BD" },
];

export const MENUS: MenuItem[] = [
  // カット
  { id: "cut-basic", category: "カット", name: "カット", price: 4950, duration: 40, lastBookingTime: "19:20" },
  { id: "cut-care-sv", category: "カット", name: "カット＋ヘアケアSV", price: 5500, duration: 50, lastBookingTime: "19:10" },
  { id: "cut-mens-esth-sv", category: "カット", name: "カット＋メンズエステSV", price: 7150, duration: 60, lastBookingTime: "19:00" },
  { id: "cut-mens-esth-sv-beauty", category: "カット", name: "カット＋メンズエステSV〜美顔器エステ", price: 8800, duration: 70, lastBookingTime: "18:50" },
  { id: "fade-cut", category: "カット", name: "フェードカット", price: 5500, duration: 50, lastBookingTime: "19:10" },
  { id: "fade-cut-care-sv", category: "カット", name: "フェードカット＋ヘアケアSV", price: 6050, duration: 60, lastBookingTime: "19:00" },
  { id: "fade-cut-mens-esth-sv", category: "カット", name: "フェードカット＋メンズエステSV", price: 7700, duration: 70, lastBookingTime: "18:50" },
  { id: "fade-cut-mens-esth-sv-beauty", category: "カット", name: "フェードカット＋メンズエステSV〜美顔器エステ", price: 9350, duration: 80, lastBookingTime: "18:40" },
  { id: "cut-junior", category: "カット", name: "ジュニア", price: 2420, duration: 30, lastBookingTime: "19:30" },
  { id: "cut-elementary", category: "カット", name: "小学生", price: 2970, duration: 30, lastBookingTime: "19:30" },
  { id: "cut-junior-high", category: "カット", name: "中学生", price: 3520, duration: 35, lastBookingTime: "19:25" },
  { id: "cut-high-school", category: "カット", name: "高校生", price: 4070, duration: 40, lastBookingTime: "19:20" },

  // カラー
  { id: "color-basic", category: "カラー", name: "カラー", price: 4950, duration: 60, lastBookingTime: "19:00" },
  { id: "color-gray", category: "カラー", name: "白髪染め", price: 4400, duration: 60, lastBookingTime: "19:00" },
  { id: "color-gray-blend", category: "カラー", name: "白髪ぼかし", price: 3850, duration: 45, lastBookingTime: "19:15" },
  { id: "color-bleach", category: "カラー", name: "ブリーチ", price: 7150, duration: 90, lastBookingTime: "18:30" },
  { id: "color-highlight", category: "カラー", name: "ハイライト／メッシュ", price: 7150, duration: 90, lastBookingTime: "18:30" },

  // パーマ
  { id: "perm-point", category: "パーマ", name: "ポイントパーマ", price: 4400, duration: 60, lastBookingTime: "19:00" },
  { id: "perm-design", category: "パーマ", name: "デザインパーマ", price: 7700, duration: 90, lastBookingTime: "18:30" },
  { id: "perm-spiral", category: "パーマ", name: "スパイラルパーマ", price: 7700, duration: 90, lastBookingTime: "18:30" },
  { id: "perm-twist", category: "パーマ", name: "ツイスト／波巻きパーマ", price: 10450, duration: 120, lastBookingTime: "18:00" },
  { id: "perm-iron-half", category: "パーマ", name: "アイロンパーマハーフ", price: 4400, duration: 60, lastBookingTime: "19:00" },
  { id: "perm-iron", category: "パーマ", name: "アイロンパーマ", price: 7700, duration: 90, lastBookingTime: "18:30" },
  { id: "perm-volume-down", category: "パーマ", name: "ボリュームダウンパーマ", price: 4400, duration: 60, lastBookingTime: "19:00" },

  // 縮毛矯正
  { id: "straight-front", category: "縮毛矯正", name: "フロント矯正", price: 4400, duration: 90, lastBookingTime: "18:30" },
  { id: "straight-front-side", category: "縮毛矯正", name: "フロント＋サイド矯正", price: 6600, duration: 120, lastBookingTime: "18:00" },
  { id: "straight-full", category: "縮毛矯正", name: "全頭矯正", price: 11000, duration: 150, lastBookingTime: "17:30" },

  // スパ・トリートメント
  { id: "spa-cleansing", category: "スパ・トリートメント", name: "もみほぐしクレンジングSPA", price: 2200, duration: 30, lastBookingTime: "19:30" },
  { id: "spa-aging", category: "スパ・トリートメント", name: "頭皮エイジング予防ヘッドスパ", price: 4400, duration: 50, lastBookingTime: "19:10" },
  { id: "spa-milk", category: "スパ・トリートメント", name: "スパミルク頭皮柔らかトリートメント", price: 2200, duration: 30, lastBookingTime: "19:30" },
  { id: "treatment-organic-3", category: "スパ・トリートメント", name: "オーガニックノートシステムトリートメント 3step", price: 3300, duration: 40, lastBookingTime: "19:20" },
  { id: "treatment-organic-5", category: "スパ・トリートメント", name: "オーガニックノートシステムトリートメント 5step", price: 5500, duration: 60, lastBookingTime: "19:00" },
  { id: "treatment-nano", category: "スパ・トリートメント", name: "魔法のナノバブル", price: 1100, duration: 15, lastBookingTime: "19:45" },

  // シャンプー＆セット
  { id: "shampoo-blow", category: "シャンプー＆セット", name: "シャンプー・ブロー", price: 1650, duration: 20, lastBookingTime: "19:40" },
  { id: "hair-set", category: "シャンプー＆セット", name: "ヘアセット", price: 1100, duration: 15, lastBookingTime: "19:45" },

  // メンズシェービング
  { id: "sv-care", category: "メンズシェービング", name: "ケアSV", price: 2200, duration: 25, lastBookingTime: "19:35" },
  { id: "sv-mens-esth", category: "メンズシェービング", name: "メンズエステSV", price: 3850, duration: 35, lastBookingTime: "19:25" },
  { id: "sv-mens-esth-beauty", category: "メンズシェービング", name: "メンズエステSV〜美顔器エステ", price: 5500, duration: 45, lastBookingTime: "19:15" },
  { id: "sv-nose-wax", category: "メンズシェービング", name: "ノーズワックス", price: 1000, duration: 10, lastBookingTime: "19:50" },
] as const;

// カテゴリ別配色
export const CATEGORY_COLORS: Record<string, string> = MENU_CATEGORY_LIST.reduce(
  (acc, c) => ({ ...acc, [c.id]: c.color }),
  {} as Record<string, string>
);

export const CATEGORY_TEXT_COLORS: Record<string, string> = {
  "カット": "#FFFFFF",
  "カラー": "#FFFFFF",
  "パーマ": "#1F2937",
  "縮毛矯正": "#1F2937",
  "スパ・トリートメント": "#FFFFFF",
  "シャンプー＆セット": "#1F2937",
  "メンズシェービング": "#1F2937",
};

// カテゴリ別リスト
export const MENU_CATEGORIES = MENUS.reduce((acc, menu) => {
  if (!acc[menu.category]) {
    acc[menu.category] = [];
  }
  acc[menu.category].push(menu);
  return acc;
}, {} as Record<string, MenuItem[]>);

// メニューIDで検索
export const getMenuById = (id: string): MenuItem | undefined => {
  return MENUS.find((menu) => menu.id === id);
};

// 価格をフォーマット
export const formatPrice = (price: number): string => {
  return `¥${price.toLocaleString()}`;
};

// API用エイリアス
export const MENU_ITEMS = MENUS;

// カテゴリの表示用色（背景に対する文字色）
export const getCategoryTextColor = (category: string): string => {
  return CATEGORY_TEXT_COLORS[category] || "#FFFFFF";
};

// 複数メニューの合計を計算
export const calculateMenuTotals = (menuIds: string[]): {
  totalPrice: number;
  totalDuration: number;
  menuSummary: string;
  earliestLastBookingTime: string;
} => {
  const menus = menuIds
    .map((id) => getMenuById(id))
    .filter((m): m is MenuItem => m !== undefined);

  const totalPrice = menus.reduce((sum, m) => sum + m.price, 0);
  const totalDuration = menus.reduce((sum, m) => sum + m.duration, 0);
  const menuSummary = menus.map((m) => m.name).join(" + ");

  const earliestLastBookingTime = menus.reduce((earliest, m) => {
    return m.lastBookingTime < earliest ? m.lastBookingTime : earliest;
  }, "20:00");

  return { totalPrice, totalDuration, menuSummary, earliestLastBookingTime };
};

// カテゴリ重複チェック
export const hasDuplicateCategories = (menuIds: string[]): boolean => {
  const categories = menuIds
    .map((id) => getMenuById(id)?.category)
    .filter((c): c is string => c !== undefined);
  return new Set(categories).size !== categories.length;
};

// 選択済みカテゴリを取得
export const getSelectedCategories = (menuIds: string[]): string[] => {
  return menuIds
    .map((id) => getMenuById(id)?.category)
    .filter((c): c is string => c !== undefined);
};
