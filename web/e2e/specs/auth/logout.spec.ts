import { test, expect } from '../../fixtures/auth.fixture';
import { AdminDashboardPage } from '../../pages/admin/dashboard.page';

test.describe('ログアウト', () => {
  test.describe('管理者ログアウト', () => {
    test('管理者がログアウトできる', async ({ adminPage }) => {
      const dashboard = new AdminDashboardPage(adminPage);
      await dashboard.goto();
      await dashboard.expectDashboardVisible();

      // ログアウト
      await dashboard.logout();

      // ログインページにリダイレクトされることを確認
      await expect(adminPage).toHaveURL(/\/login|\/admin\/login/);
    });

    test('ログアウト後に保護ページにアクセスできない', async ({ adminPage }) => {
      const dashboard = new AdminDashboardPage(adminPage);
      await dashboard.goto();
      await dashboard.logout();

      // 管理画面にアクセスしようとする
      await adminPage.goto('/admin');

      // ログインページにリダイレクトされる
      await expect(adminPage).toHaveURL(/\/login|\/admin\/login/);
    });
  });

  // 顧客ログアウトは認証セッションが確立されている場合のみテスト可能
  test.describe('顧客ログアウト', () => {
    test.skip('顧客がログアウトできる', async ({ authenticatedPage }) => {
      // 顧客セッションが確立されている場合のみ実行
      await authenticatedPage.goto('/mypage');

      // ログアウトボタンをクリック
      await authenticatedPage.click('button:has-text("ログアウト")');

      // トップページまたはログインページにリダイレクト
      await expect(authenticatedPage).toHaveURL(/\/|\/login/);
    });
  });
});
