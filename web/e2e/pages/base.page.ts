import { Page, Locator, expect } from '@playwright/test';

/**
 * 基底ページクラス
 * すべてのPage Objectの共通機能を提供
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * ページへ移動
   */
  async goto(path: string = ''): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * ページタイトルを取得
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * 現在のURLを取得
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * URLが一致するまで待機
   */
  async waitForUrl(url: string | RegExp, options?: { timeout?: number }): Promise<void> {
    await this.page.waitForURL(url, options);
  }

  /**
   * 要素が表示されるまで待機
   */
  async waitForVisible(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await expect(locator).toBeVisible(options);
  }

  /**
   * 要素が非表示になるまで待機
   */
  async waitForHidden(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await expect(locator).toBeHidden(options);
  }

  /**
   * ローディング完了を待機
   */
  async waitForLoadingComplete(): Promise<void> {
    // ローディングスピナーが消えるまで待機
    const loadingIndicators = [
      this.page.locator('[data-loading="true"]'),
      this.page.locator('.loading'),
      this.page.locator('[aria-busy="true"]'),
    ];

    for (const indicator of loadingIndicators) {
      if (await indicator.isVisible()) {
        await expect(indicator).toBeHidden({ timeout: 30000 });
      }
    }
  }

  /**
   * トースト/通知メッセージを確認
   */
  async expectToastMessage(message: string): Promise<void> {
    const toast = this.page.locator('[role="alert"], .toast, .notification').filter({ hasText: message });
    await expect(toast).toBeVisible({ timeout: 10000 });
  }

  /**
   * エラーメッセージを確認
   */
  async expectErrorMessage(message: string): Promise<void> {
    const error = this.page.locator('.error, [role="alert"], .text-red-500, .text-red-600').filter({ hasText: message });
    await expect(error).toBeVisible();
  }

  /**
   * ページ内のテキストを確認
   */
  async expectText(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  /**
   * スクリーンショットを撮影
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
  }

  /**
   * ヘッダーの存在を確認
   */
  async expectHeaderVisible(): Promise<void> {
    await expect(this.page.locator('header')).toBeVisible();
  }

  /**
   * フッターの存在を確認
   */
  async expectFooterVisible(): Promise<void> {
    await expect(this.page.locator('footer')).toBeVisible();
  }
}
