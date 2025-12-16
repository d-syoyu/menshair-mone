import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * MONE E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // テストディレクトリ
  testDir: './e2e/specs',

  // テストファイルのパターン
  testMatch: '**/*.spec.ts',

  // 並列実行
  fullyParallel: true,

  // CI環境では.only()を禁止
  forbidOnly: !!process.env.CI,

  // リトライ設定（CI環境では2回リトライ）
  retries: process.env.CI ? 2 : 0,

  // ワーカー数（CI環境では1に制限）
  workers: process.env.CI ? 1 : undefined,

  // レポーター設定
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // グローバル設定
  use: {
    // ベースURL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // トレース（リトライ時のみ）
    trace: 'on-first-retry',

    // スクリーンショット（失敗時のみ）
    screenshot: 'only-on-failure',

    // ビデオ（失敗時のみ保持）
    video: 'retain-on-failure',

    // タイムアウト設定
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // ロケール設定（日本語）
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  },

  // プロジェクト設定
  projects: [
    // 認証セットアップ（管理者）
    {
      name: 'admin-setup',
      testMatch: /admin\.setup\.ts/,
    },

    // 認証セットアップ（顧客）
    {
      name: 'customer-setup',
      testMatch: /customer\.setup\.ts/,
    },

    // メインテスト（Chromium）
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['admin-setup', 'customer-setup'],
    },

    // モバイルテスト（オプション）
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    //   dependencies: ['admin-setup', 'customer-setup'],
    // },
  ],

  // 開発サーバー設定
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // グローバルセットアップ/クリーンアップ
  globalSetup: path.resolve('./e2e/global-setup.ts'),
  globalTeardown: path.resolve('./e2e/global-teardown.ts'),

  // 出力ディレクトリ
  outputDir: './e2e/test-results',

  // タイムアウト設定
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
});
