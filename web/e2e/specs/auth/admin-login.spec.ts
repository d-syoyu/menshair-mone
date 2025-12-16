import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../pages/admin-login.page';
import { adminUser } from '../../fixtures/test-data';

test.describe('管理者ログイン', () => {
  let loginPage: AdminLoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new AdminLoginPage(page);
    await loginPage.goto();
  });

  test('ログインフォームが表示される', async () => {
    await loginPage.expectFormVisible();
  });

  test('正しい認証情報でログイン成功', async () => {
    await loginPage.login(adminUser.email, adminUser.password);
    await loginPage.expectLoginSuccess();
  });

  test('不正なパスワードでログイン失敗', async () => {
    await loginPage.login(adminUser.email, 'wrongpassword');
    await loginPage.expectLoginFailure();
  });

  test('存在しないメールアドレスでログイン失敗', async () => {
    await loginPage.login('nonexistent@example.com', 'password123');
    await loginPage.expectLoginFailure();
  });

  test('空のフォームで送信するとバリデーションエラー', async ({ page }) => {
    // HTML5バリデーションを使用しているため、requiredフィールドの確認
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    // required属性があるかどうか（値は空文字または任意の値）
    const hasRequired = await emailInput.getAttribute('required');
    // required属性が存在すればOK（値がnullでなければ属性が存在する）
    expect(hasRequired !== null || await emailInput.evaluate(el => el.hasAttribute('required'))).toBeTruthy();
  });

  test('ログイン後にダッシュボードが表示される', async ({ page }) => {
    await loginPage.login(adminUser.email, adminUser.password);
    await loginPage.expectLoginSuccess();

    // ダッシュボードの要素を確認
    await expect(page.locator('h1, h2').filter({ hasText: /ダッシュボード|管理/ })).toBeVisible();
  });
});
