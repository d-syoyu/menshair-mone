import { FullConfig, request } from '@playwright/test';

/**
 * グローバルセットアップ
 * テストスイート開始前に一度だけ実行される
 * テスト用ログインAPIを使用して認証をバイパス
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');

  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';

  try {
    // APIリクエストコンテキストを作成
    const apiContext = await request.newContext({
      baseURL,
    });

    // 管理者セッションの作成
    console.log('📝 Creating admin session via test API...');
    const adminResponse = await apiContext.post('/api/auth/test-login', {
      data: {
        email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
        password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
      },
    });

    if (adminResponse.ok()) {
      const adminResult = await adminResponse.json();
      console.log(`✅ Admin session created: ${adminResult.user?.email}`);

      // APIコンテキストからセッション状態を保存
      await apiContext.storageState({ path: 'e2e/.auth/admin.json' });
    } else {
      console.log('⚠️ Admin test API login failed, creating empty session');
      const fs = await import('fs');
      fs.mkdirSync('e2e/.auth', { recursive: true });
      fs.writeFileSync('e2e/.auth/admin.json', JSON.stringify({ cookies: [], origins: [] }));
    }

    // 顧客セッションの作成
    console.log('📝 Creating customer session via test API...');
    const customerApiContext = await request.newContext({ baseURL });
    const customerResponse = await customerApiContext.post('/api/auth/test-login', {
      data: {
        email: process.env.TEST_CUSTOMER_EMAIL || 'test-customer@example.com',
        password: process.env.TEST_CUSTOMER_PASSWORD || 'test-password-12345',
      },
    });

    if (customerResponse.ok()) {
      const customerResult = await customerResponse.json();
      console.log(`✅ Customer session created: ${customerResult.user?.email}`);
      await customerApiContext.storageState({ path: 'e2e/.auth/customer.json' });
    } else {
      console.log('⚠️ Customer test API login failed, creating empty session');
      const fs = await import('fs');
      fs.mkdirSync('e2e/.auth', { recursive: true });
      fs.writeFileSync('e2e/.auth/customer.json', JSON.stringify({ cookies: [], origins: [] }));
    }

    await apiContext.dispose();
    await customerApiContext.dispose();

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    // セッションファイルが存在しない場合のフォールバック
    const fs = await import('fs');
    const emptyState = { cookies: [], origins: [] };

    fs.mkdirSync('e2e/.auth', { recursive: true });
    fs.writeFileSync('e2e/.auth/admin.json', JSON.stringify(emptyState));
    fs.writeFileSync('e2e/.auth/customer.json', JSON.stringify(emptyState));

    console.log('⚠️ Created empty session files as fallback');
  }

  console.log('🎉 Global setup completed');
}

export default globalSetup;
