// constants/menu.ts
// Hair Salon White - メニュー定義

export type MenuItem = {
  id: string;
  category: string;
  name: string;
  price: number;
  duration: number; // 所要時間（分）
  lastBookingTime: string; // 最終受付時間
};

export const MENUS: MenuItem[] = [
  // カット
  {
    id: "cut",
    category: "カット",
    name: "カット",
    price: 4950,
    duration: 60,
    lastBookingTime: "19:00",
  },
  // カラー
  {
    id: "color-short",
    category: "カラー",
    name: "カラー（ショート）",
    price: 4950,
    duration: 90,
    lastBookingTime: "18:00",
  },
  {
    id: "color-medium",
    category: "カラー",
    name: "カラー（ミディアム）",
    price: 5500,
    duration: 90,
    lastBookingTime: "18:00",
  },
  {
    id: "color-long",
    category: "カラー",
    name: "カラー（ロング）",
    price: 6050,
    duration: 90,
    lastBookingTime: "18:00",
  },
  {
    id: "color-superlong",
    category: "カラー",
    name: "カラー（スーパーロング）",
    price: 6600,
    duration: 90,
    lastBookingTime: "18:00",
  },
  // パーマ
  {
    id: "perm-point",
    category: "パーマ",
    name: "ポイントパーマ",
    price: 4400,
    duration: 90,
    lastBookingTime: "18:00",
  },
  {
    id: "perm-all",
    category: "パーマ",
    name: "パーマオール",
    price: 7700,
    duration: 90,
    lastBookingTime: "18:00",
  },
  // トリートメント
  {
    id: "treatment",
    category: "トリートメント",
    name: "トリートメント",
    price: 3300,
    duration: 60,
    lastBookingTime: "19:00",
  },
  // 縮毛矯正
  {
    id: "straightening",
    category: "縮毛矯正",
    name: "縮毛矯正",
    price: 11000,
    duration: 100,
    lastBookingTime: "18:00",
  },
  // スパ
  {
    id: "spa-massage",
    category: "スパ",
    name: "もみほぐしスパ",
    price: 2200,
    duration: 60,
    lastBookingTime: "19:00",
  },
  {
    id: "spa-treatment",
    category: "スパ",
    name: "トリートメントスパ",
    price: 2200,
    duration: 60,
    lastBookingTime: "19:00",
  },
  // その他
  {
    id: "shampoo-blow",
    category: "その他",
    name: "シャンプーブロー",
    price: 1650,
    duration: 60,
    lastBookingTime: "19:00",
  },
  {
    id: "hair-set",
    category: "その他",
    name: "ヘアセット",
    price: 1100,
    duration: 60,
    lastBookingTime: "19:00",
  },
] as const;

// カテゴリでグループ化
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

// エイリアス（APIで使用）
export const MENU_ITEMS = MENUS;

// カテゴリリスト
export const MENU_CATEGORY_LIST = [
  { id: "カット", title: "Cut" },
  { id: "カラー", title: "Color" },
  { id: "パーマ", title: "Perm" },
  { id: "トリートメント", title: "Treatment" },
  { id: "縮毛矯正", title: "Straightening" },
  { id: "スパ", title: "Head Spa" },
  { id: "その他", title: "Other" },
] as const;

// カテゴリ別カラー（タイムライン表示用）
export const CATEGORY_COLORS: Record<string, string> = {
  "カット": "#8B7355",      // 茶色系
  "カラー": "#9F86C0",      // 紫色系
  "パーマ": "#E0B1CB",      // ピンク系
  "トリートメント": "#98C1D9", // 水色系
  "縮毛矯正": "#F4A261",    // オレンジ系
  "スパ": "#2A9D8F",        // ティール系
  "その他": "#ADB5BD",      // グレー系
};

// 複数メニューの合計を計算
export const calculateMenuTotals = (menuIds: string[]): {
  totalPrice: number;
  totalDuration: number;
  menuSummary: string;
  earliestLastBookingTime: string;
} => {
  const menus = menuIds.map(id => getMenuById(id)).filter((m): m is MenuItem => m !== undefined);

  const totalPrice = menus.reduce((sum, m) => sum + m.price, 0);
  const totalDuration = menus.reduce((sum, m) => sum + m.duration, 0);
  const menuSummary = menus.map(m => m.name).join(" + ");

  // 最も早い最終受付時間を取得
  const earliestLastBookingTime = menus.reduce((earliest, m) => {
    return m.lastBookingTime < earliest ? m.lastBookingTime : earliest;
  }, "20:00");

  return { totalPrice, totalDuration, menuSummary, earliestLastBookingTime };
};

// カテゴリの重複をチェック
export const hasDuplicateCategories = (menuIds: string[]): boolean => {
  const categories = menuIds
    .map(id => getMenuById(id)?.category)
    .filter((c): c is string => c !== undefined);
  return new Set(categories).size !== categories.length;
};

// 選択済みカテゴリを取得
export const getSelectedCategories = (menuIds: string[]): string[] => {
  return menuIds
    .map(id => getMenuById(id)?.category)
    .filter((c): c is string => c !== undefined);
};
