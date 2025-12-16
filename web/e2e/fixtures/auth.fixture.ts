import { test as base, Page, BrowserContext } from '@playwright/test';

/**
 * 認証フィクスチャ
 * 認証済みのページコンテキストを提供
 */

// フィクスチャの型定義
type AuthFixtures = {
  /** 管理者ログイン済みページ */
  adminPage: Page;
  /** 顧客ログイン済みページ */
  authenticatedPage: Page;
  /** 管理者コンテキスト */
  adminContext: BrowserContext;
  /** 顧客コンテキスト */
  customerContext: BrowserContext;
};

/**
 * 認証済みフィクスチャを含むテスト
 */
export const test = base.extend<AuthFixtures>({
  // 管理者ログイン済みコンテキスト
  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/admin.json',
    });
    await use(context);
    await context.close();
  },

  // 管理者ログイン済みページ
  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
    await page.close();
  },

  // 顧客ログイン済みコンテキスト
  customerContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/customer.json',
    });
    await use(context);
    await context.close();
  },

  // 顧客ログイン済みページ
  authenticatedPage: async ({ customerContext }, use) => {
    const page = await customerContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
