import { FullConfig } from '@playwright/test';

/**
 * グローバルティアダウン
 * テストスイート終了後に一度だけ実行される
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');

  try {
    // テストデータのクリーンアップ（必要に応じて）
    // 注意: 本番DBを使用している場合は慎重に
    if (process.env.E2E_CLEANUP_DATA === 'true') {
      console.log('🗑️ Cleaning up test data...');
      // テストで作成したデータをクリーンアップ
      // 例: テスト用予約の削除、テストユーザーの削除など
    }

    // 認証セッションファイルの削除（オプション）
    if (process.env.E2E_CLEANUP_AUTH === 'true') {
      const fs = await import('fs');
      const authDir = 'e2e/.auth';

      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true });
        console.log('🗑️ Removed auth session files');
      }
    }

    console.log('✅ Global teardown completed');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  }
}

export default globalTeardown;
