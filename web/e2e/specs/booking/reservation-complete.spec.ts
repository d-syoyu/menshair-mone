import { test, expect } from '../../fixtures/auth.fixture';
import { BookingConfirmPage, BookingCompletePage } from '../../pages/booking.page';

test.describe('予約フロー - 予約確認・完了', () => {
  // 注意: このテストは認証済みセッションが必要

  test.describe('予約確認画面', () => {
    test.skip('予約内容が正しく表示される', async ({ adminPage }) => {
      // 予約フロー経由で確認画面に到達する必要がある
      // このテストは統合テストとして実行
      const confirmPage = new BookingConfirmPage(adminPage);

      await adminPage.goto('/booking/confirm');
      // 実際のフローでは、メニュー選択→日時選択を経由する必要がある
    });

    test.skip('備考を入力できる', async ({ adminPage }) => {
      const confirmPage = new BookingConfirmPage(adminPage);
      await adminPage.goto('/booking/confirm');

      await confirmPage.enterNote('テスト備考メッセージ');
    });

    test.skip('クーポンコードを適用できる', async ({ adminPage }) => {
      const confirmPage = new BookingConfirmPage(adminPage);
      await adminPage.goto('/booking/confirm');

      await confirmPage.applyCoupon('TEST2024');
      // クーポン適用結果を確認
    });
  });

  test.describe('予約完了画面', () => {
    test.skip('予約完了メッセージが表示される', async ({ adminPage }) => {
      const completePage = new BookingCompletePage(adminPage);
      await adminPage.goto('/booking/complete');

      await completePage.expectCompletionMessage();
    });

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
