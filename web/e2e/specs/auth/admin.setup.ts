import { test as setup, expect } from '@playwright/test';
import { adminUser } from '../../fixtures/test-data';

/**
 * 管理者認証セットアップ
 * テスト実行前に管理者セッションを作成
 */
setup('管理者ログインセッション作成', async ({ page }) => {
  // 管理者ログインページへ移動
  await page.goto('/admin/login');

  // ログインフォームが表示されるまで待機
  await page.waitForLoadState('networkidle');

  // 認証情報を入力
  await page.fill('input[name="email"], input[type="email"]', adminUser.email);
  await page.fill('input[name="password"], input[type="password"]', adminUser.password);

  // ログインボタンをクリック
  await page.click('button[type="submit"]');

  // ダッシュボードへのリダイレクトを待機
  await page.waitForURL('**/admin', { timeout: 30000 });

  // ダッシュボードが表示されていることを確認
  await expect(page.locator('h1, h2').filter({ hasText: /ダッシュボード|管理/ })).toBeVisible({ timeout: 10000 });

  // セッション状態を保存
  await page.context().storageState({ path: 'e2e/.auth/admin.json' });
});
