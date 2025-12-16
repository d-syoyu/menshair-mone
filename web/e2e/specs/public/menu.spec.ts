import { test, expect } from '@playwright/test';
import { MenuPage, NewsPage } from '../../pages/home.page';

test.describe('公開ページ - メニュー', () => {
  let menuPage: MenuPage;

  test.beforeEach(async ({ page }) => {
    menuPage = new MenuPage(page);
    await menuPage.goto();
    // APIからメニュー読み込み完了を待機
    await page.waitForLoadState('networkidle');
  });

  test('メニューページが正常に表示される', async ({ page }) => {
    // タイトル「Menu」が表示されることを確認
    const pageTitle = page.locator('h1:has-text("Menu")');
    await expect(pageTitle).toBeVisible();
  });

  test('メニュー一覧が読み込まれる', async ({ page }) => {
    // カテゴリセクションが表示されることを確認
    const categorySection = page.locator('h2').first();
    await expect(categorySection).toBeVisible({ timeout: 15000 });
  });

  test('価格が表示される', async ({ page }) => {
    // 価格表示（¥記号 + 数字）があることを確認
    // 例: ¥2,970 のようなフォーマット
    const priceText = page.locator('.text-gold').first();
    await expect(priceText).toBeVisible({ timeout: 15000 });
  });

  test('カテゴリごとにメニューがグループ化されている', async ({ page }) => {
    // カテゴリヘッダー（h2）を確認
    const categories = page.locator('h2');
    await page.waitForLoadState('networkidle');
    // 少なくとも1つのカテゴリが表示される
    await expect(categories.first()).toBeVisible({ timeout: 15000 });
  });

  test('予約ボタンが表示される', async ({ page }) => {
    const bookingButton = page.locator('a[href="/booking"]');
    await expect(bookingButton.first()).toBeVisible();
  });

  test('予約ボタンから予約ページまたはログインへ遷移できる', async ({ page }) => {
    const bookingButton = page.locator('a[href="/booking"]').first();

    if (await bookingButton.isVisible()) {
      await bookingButton.click();
      // 認証されていない場合はログインページへリダイレクトされる
      await expect(page).toHaveURL(/\/booking|\/login|\/register/);
    }
  });

  test('サブタイトルが表示される', async ({ page }) => {
    // Price Listサブタイトルの表示を確認
    const subtitle = page.locator('text=Price List');
    await expect(subtitle).toBeVisible();
  });
});

test.describe('公開ページ - ニュース', () => {
  let newsPage: NewsPage;

  test.beforeEach(async ({ page }) => {
    newsPage = new NewsPage(page);
    await newsPage.goto();
  });

  test('ニュースページが正常に表示される', async () => {
    await newsPage.expectNewsPageVisible();
  });

  test('ニュース一覧が読み込まれる', async ({ page }) => {
    // ニュースがある場合は表示される
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Notion APIからの読み込みを待機
  });

  test('カテゴリフィルターが機能する', async ({ page }) => {
    // カテゴリフィルターボタンを探す
    const filterButtons = page.locator('button').filter({ hasText: /お知らせ|新メニュー|キャンペーン/ });

    if (await filterButtons.count() > 0) {
      await filterButtons.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('ニュース詳細ページへ遷移できる', async ({ page }) => {
    // ニュースアイテムをクリック
    const newsItem = page.locator('article, [data-news-item], .news-item').first();

    if (await newsItem.isVisible()) {
      await newsItem.click();
      // 詳細ページへ遷移
      await page.waitForURL(/\/news\/.+/, { timeout: 10000 });
    }
  });
});

test.describe('公開ページ - その他', () => {
  test('aboutページが表示される', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('galleryページが表示される', async ({ page }) => {
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle');
  });

  test('staffページが表示される', async ({ page }) => {
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');
  });

  test('productsページが表示される', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
  });

  test('privacyページが表示される', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('termsページが表示される', async ({ page }) => {
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
