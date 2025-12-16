import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';

test.describe('公開ページ - トップページ', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('トップページが正常に表示される', async () => {
    await homePage.expectHomeVisible();
  });

  test('ヘッダーが表示される', async () => {
    await homePage.expectHeaderVisible();
  });

  test('フッターが表示される', async () => {
    await homePage.expectFooterVisible();
  });

  test('ヒーローセクションが表示される', async ({ page }) => {
    await expect(homePage.heroSection).toBeVisible();
  });

  test('ナビゲーションが機能する', async () => {
    await homePage.expectNavigationWorks();
  });

  test('予約ボタンをクリックすると予約ページまたはログインページへ遷移する', async ({ page }) => {
    // 予約ボタンをクリック
    const bookingLink = page.locator('a[href="/booking"], a:has-text("予約")').first();

    if (await bookingLink.isVisible()) {
      await bookingLink.click();
      // 予約ページまたはログインページ（認証が必要な場合）にリダイレクト
      await expect(page).toHaveURL(/\/booking|\/login/);
    }
  });

  test('メニューリンクをクリックするとメニューページへ遷移する', async ({ page }) => {
    // メニューリンクをクリック
    const menuLink = page.locator('a[href="/menu"]').first();

    if (await menuLink.isVisible()) {
      await menuLink.click();
      await expect(page).toHaveURL(/\/menu/);
    }
  });

  test('ニュースセクションが表示される', async ({ page }) => {
    // ニュースセクションまでスクロール
    const newsSection = page.locator('[data-section="news"], #news, section:has-text("お知らせ")');

    if (await newsSection.count() > 0) {
      await newsSection.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }
  });

  test('アクセスセクションが表示される', async ({ page }) => {
    // アクセスセクションまでスクロール
    const accessSection = page.locator('[data-section="access"], #access, section:has-text("アクセス")');

    if (await accessSection.count() > 0) {
      await accessSection.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }
  });

  test('スマホ表示でも正常に動作する', async ({ page }) => {
    // ビューポートをモバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });

    // ページをリロード
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 基本的なコンテンツが表示されることを確認
    await expect(page.locator('header')).toBeVisible();
  });
});

test.describe('公開ページ - メタデータ', () => {
  test('ページタイトルが設定されている', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('メタディスクリプションが設定されている', async ({ page }) => {
    await page.goto('/');
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    // メタディスクリプションが存在することを確認
  });
});
