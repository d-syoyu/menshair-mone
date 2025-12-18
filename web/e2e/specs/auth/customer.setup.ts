import { test as setup, expect } from '@playwright/test';
import { customerUser } from '../../fixtures/test-data';

/**
 * 顧客認証セットアップ
 * テスト環境用のバイパスAPIを使用して顧客セッションを作成
 */
setup('顧客ログインセッション作成', async ({ page, request }) => {
  // テスト用ログインAPIを使用して認証
  const response = await request.post('/api/auth/test-login', {
    data: {
      email: customerUser.email,
      password: customerUser.password,
    },
  });

  if (response.ok()) {
    const result = await response.json();
    console.log(`✅ 顧客セッション作成成功: ${result.user?.email}`);

    // Cookieを取得してページに設定
    const cookies = await request.storageState();

    // ページを開いてセッション状態を確認
    await page.goto('/');
    await page.context().addCookies(cookies.cookies);

    // セッション状態を保存
    await page.context().storageState({ path: 'e2e/.auth/customer.json' });

    console.log('✅ 顧客セッションファイルを保存しました');
  } else {
    // フォールバック: テスト用顧客がDBに存在しない場合
    console.log('⚠️ テスト用顧客ユーザーが見つかりません');
    console.log('   テスト用顧客をDBに追加するか、seedを実行してください');

    // 空のセッションファイルを作成（顧客認証テストはスキップされる）
    await page.goto('/');
    await page.context().storageState({ path: 'e2e/.auth/customer.json' });

    console.log('⚠️ 空のセッションファイルを作成しました（顧客認証テストはスキップされます）');
  }
});
