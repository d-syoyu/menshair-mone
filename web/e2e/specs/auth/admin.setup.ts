import { test as setup, expect } from '@playwright/test';
import { adminUser } from '../../fixtures/test-data';

/**
 * 管理者認証セットアップ
 * テスト環境用のバイパスAPIを使用して管理者セッションを作成
 */
setup('管理者ログインセッション作成', async ({ page, request }) => {
  // テスト用ログインAPIを使用して認証
  const response = await request.post('/api/auth/test-login', {
    data: {
      email: adminUser.email,
      password: adminUser.password,
    },
  });

  if (response.ok()) {
    const result = await response.json();
    console.log(`✅ 管理者セッション作成成功: ${result.user?.email}`);

    // Cookieを取得してページに設定
    const cookies = await request.storageState();

    // ページを開いてセッション状態を確認
    await page.goto('/admin');
    await page.context().addCookies(cookies.cookies);

    // セッション状態を保存
    await page.context().storageState({ path: 'e2e/.auth/admin.json' });

    console.log('✅ 管理者セッションファイルを保存しました');
  } else {
    // フォールバック: 従来のフォームログイン
    console.log('⚠️ テストAPIが利用できないため、フォームログインを試行します');

    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="email"], input[type="email"]', adminUser.email);
    await page.fill('input[name="password"], input[type="password"]', adminUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin', { timeout: 30000 });
    await expect(page.locator('h1, h2').filter({ hasText: /ダッシュボード|管理/ })).toBeVisible({ timeout: 10000 });

    await page.context().storageState({ path: 'e2e/.auth/admin.json' });
  }
});
