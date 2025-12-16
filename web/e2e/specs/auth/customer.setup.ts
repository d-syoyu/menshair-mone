import { test as setup } from '@playwright/test';

/**
 * 顧客認証セットアップ
 *
 * 注意: 本プロジェクトではMagic Link / LINE認証を使用しているため、
 * E2Eテストでの自動ログインは困難です。
 *
 * 以下のいずれかの方法で対応可能:
 * 1. テスト環境用のバイパス認証APIを実装
 * 2. テストではセッションなしで実行（保護されたページのテストはスキップ）
 * 3. 手動でセッションファイルを作成
 */
setup('顧客ログインセッション作成', async ({ page }) => {
  // 空のセッションファイルを作成（プレースホルダー）
  // 実際の顧客認証が必要な場合は、テスト環境用のバイパスを実装してください

  const emptyState = {
    cookies: [],
    origins: [],
  };

  // セッション状態を保存（空の状態）
  await page.context().storageState({ path: 'e2e/.auth/customer.json' });

  console.log('⚠️ 顧客セッションはプレースホルダーとして作成されました');
  console.log('   顧客認証が必要なテストは、テスト環境用バイパスの実装後に有効化してください');
});
