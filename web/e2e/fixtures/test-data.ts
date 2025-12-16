/**
 * テストデータ定義
 */

// 管理者テストデータ
export const adminUser = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
  name: 'テスト管理者',
};

// 顧客テストデータ
export const customerUser = {
  email: 'test-customer@example.com',
  name: 'テスト顧客',
  phone: '090-1234-5678',
};

// メニューカテゴリ
export const testCategories = [
  { name: 'カット', nameEn: 'CUT', color: '#8B7355' },
  { name: 'カラー', nameEn: 'COLOR', color: '#9F86C0' },
  { name: 'パーマ', nameEn: 'PERM', color: '#E0B1CB' },
  { name: 'ヘッドスパ', nameEn: 'HEAD SPA', color: '#5E7C84' },
  { name: 'シェービング', nameEn: 'SHAVING', color: '#A8DADC' },
];

// テストメニュー
export const testMenus = [
  { name: 'カット', price: 4950, duration: 40, category: 'カット' },
  { name: 'フェードカット', price: 5500, duration: 50, category: 'カット' },
  { name: 'カラー', price: 4950, duration: 60, category: 'カラー' },
  { name: 'ヘッドスパ（30分）', price: 3300, duration: 30, category: 'ヘッドスパ' },
  { name: 'シェービング', price: 2200, duration: 20, category: 'シェービング' },
];

// テスト予約データ
export const testReservation = {
  date: getNextAvailableDate(),
  startTime: '11:00',
  menus: ['カット'],
  note: 'E2Eテスト予約',
};

// テストクーポン
export const testCoupon = {
  code: 'TEST2024',
  name: 'テストクーポン',
  type: 'PERCENTAGE',
  value: 10,
};

/**
 * 次の予約可能日を取得（月曜を除く）
 */
function getNextAvailableDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1); // 明日

  // 月曜日（1）をスキップ
  while (date.getDay() === 1) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().split('T')[0];
}

/**
 * 日付フォーマット（表示用）
 */
export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];

  return `${year}年${month}月${day}日（${weekday}）`;
}

/**
 * 価格フォーマット
 */
export function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}
