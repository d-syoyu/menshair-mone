import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 管理者ログインページ
 */
export class AdminLoginPage extends BasePage {
  // ロケーター
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page);

    this.emailInput = page.locator('input[name="email"], input[type="email"]');
    this.passwordInput = page.locator('input[name="password"], input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error, [role="alert"], .text-red-500');
    this.pageTitle = page.locator('h1, h2').first();
  }

  /**
   * ログインページへ移動
   */
  async goto(): Promise<void> {
    await this.page.goto('/admin/login');
  }

  /**
   * ログイン実行
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * ログイン成功を確認（ダッシュボードへリダイレクト）
   */
  async expectLoginSuccess(): Promise<void> {
    await this.page.waitForURL('**/admin', { timeout: 30000 });
    // ダッシュボードが表示されていることを確認
    await expect(this.page.locator('h1, h2').filter({ hasText: /ダッシュボード|管理/ })).toBeVisible();
  }

  /**
   * ログイン失敗を確認
   */
  async expectLoginFailure(errorText?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (errorText) {
      await expect(this.errorMessage).toContainText(errorText);
    }
  }

  /**
   * ページタイトルを確認
   */
  async expectPageTitle(title: string): Promise<void> {
    await expect(this.pageTitle).toContainText(title);
  }

  /**
   * フォームが表示されていることを確認
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
