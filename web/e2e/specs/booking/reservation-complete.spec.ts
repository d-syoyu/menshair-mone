import { test, expect } from '../../fixtures/auth.fixture';
import { BookingConfirmPage, BookingCompletePage } from '../../pages/booking.page';

test.describe('予約フロー - 予約確認・完了', () => {
  // 注意: これらのテストは完全な予約フローを経由する必要がある
  // /booking/confirm は URLパラメータ(menuIds, date, time)がないと「予約情報が見つかりません」と表示される

  test.describe('予約確認画面', () => {
    test('予約情報がない場合はエラーメッセージが表示される', async ({ adminPage }) => {
      // 直接アクセス（URLパラメータなし）
      await adminPage.goto('/booking/confirm');

      // 「予約情報が見つかりません」メッセージが表示される
      await expect(adminPage.getByText('予約情報が見つかりません')).toBeVisible();
    });

    // 備考入力テスト - 完全な予約フローが必要なためスキップ
    test.skip('備考を入力できる', async ({ adminPage }) => {
      // 注: このテストは完全な予約フロー（メニュー選択→日時選択→確認画面）を経由する必要がある
      const confirmPage = new BookingConfirmPage(adminPage);
      await confirmPage.enterNote('テスト備考メッセージ');
    });

    // クーポン機能は未実装のためスキップ
    test.skip('クーポンコードを適用できる', async ({ adminPage }) => {
      // 注: クーポン機能は現在未実装
      const confirmPage = new BookingConfirmPage(adminPage);
      await confirmPage.applyCoupon('TEST2024');
    });
  });

  test.describe('予約完了画面', () => {
    test('予約完了ページにアクセスできる', async ({ adminPage }) => {
      await adminPage.goto('/booking/complete');
      // 完了ページが表示される（IDがない場合でもページ自体は表示される）
      await expect(adminPage).toHaveURL(/\/booking\/complete/);
    });

    // マイページ移動テスト - 完了画面の構造によっては動作しない場合あり
    test.skip('マイページへ移動できる', async ({ adminPage }) => {
      const completePage = new BookingCompletePage(adminPage);
      await adminPage.goto('/booking/complete');
      await completePage.goToMypage();
      await expect(adminPage).toHaveURL(/\/mypage/);
    });
  });
});

test.describe('予約フロー - 認証チェック', () => {
  test('未ログインユーザーは予約確認画面にアクセスできない', async ({ page }) => {
    await page.goto('/booking/confirm');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login|\/register/);
  });

  test('未ログインユーザーは予約ページにアクセスするとログインにリダイレクトされる', async ({ page }) => {
    await page.goto('/booking');

    // ログインページにリダイレクトされる（認証必須）
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login|\/register/);
  });

  test('認証済みユーザーは予約ページにアクセスできる', async ({ adminPage }) => {
    await adminPage.goto('/booking');
    await adminPage.waitForLoadState('networkidle');

    // 予約ページが表示される
    await expect(adminPage).toHaveURL(/\/booking/);

    // ご予約ヘッダーが表示される
    const heading = adminPage.locator('h1:has-text("ご予約")');
    await expect(heading).toBeVisible();
  });
});
