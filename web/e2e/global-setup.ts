import { chromium, FullConfig } from '@playwright/test';

/**
 * グローバルセットアップ
 * テストスイート開始前に一度だけ実行される
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');

  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';

  // ブラウザを起動して認証セッションを作成
  const browser = await chromium.launch();

  try {
    // 管理者セッションの作成
    console.log('📝 Creating admin session...');
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${baseURL}/admin/login`);

    // 管理者ログインフォームに入力
    await adminPage.fill('input[name="email"]', process.env.TEST_ADMIN_EMAIL || 'admin@example.com');
    await adminPage.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD || 'admin123');
    await adminPage.click('button[type="submit"]');

    // ダッシュボードへのリダイレクトを待機
    await adminPage.waitForURL('**/admin', { timeout: 30000 });
    console.log('✅ Admin session created');

    // セッションを保存
    await adminContext.storageState({ path: 'e2e/.auth/admin.json' });
    await adminContext.close();

    // 顧客セッションの作成（テスト環境用バイパス）
    // 本番のMagic Link認証はスキップし、テスト用エンドポイントを使用
    console.log('📝 Creating customer session...');
    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();

    // テスト用顧客セッション作成
    // 注意: 本番環境では動作しない。テスト環境でのみ有効なバイパス
    if (process.env.NODE_ENV === 'test' || process.env.E2E_TEST_MODE === 'true') {
      // テスト用APIエンドポイントでセッション作成
      await customerPage.goto(`${baseURL}/api/auth/test-login?email=test@example.com`);
    }

    // セッションを保存（空の状態でも保存しておく）
    await customerContext.storageState({ path: 'e2e/.auth/customer.json' });
    await customerContext.close();

    console.log('✅ Customer session created (or placeholder saved)');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    // セッションファイルが存在しない場合のフォールバック
    // 空のセッション状態を作成
    const fs = await import('fs');
    const emptyState = { cookies: [], origins: [] };

    fs.mkdirSync('e2e/.auth', { recursive: true });
    fs.writeFileSync('e2e/.auth/admin.json', JSON.stringify(emptyState));
    fs.writeFileSync('e2e/.auth/customer.json', JSON.stringify(emptyState));

    console.log('⚠️ Created empty session files as fallback');
  } finally {
    await browser.close();
  }

  console.log('🎉 Global setup completed');
}

export default globalSetup;
