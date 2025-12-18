import { test, expect } from '../../fixtures/auth.fixture';
import { MypagePage, ReservationHistoryPage } from '../../pages/mypage.page';

test.describe('マイページ', () => {

  test.describe('マイページダッシュボード', () => {
    test('マイページが表示される', async ({ authenticatedPage }) => {
      const mypage = new MypagePage(authenticatedPage);
      await mypage.goto();
      await mypage.expectMypageVisible();
    });

    test('新規予約ボタンが機能する', async ({ authenticatedPage }) => {
      const mypage = new MypagePage(authenticatedPage);
      await mypage.goto();
      await mypage.goToNewReservation();

      await expect(authenticatedPage).toHaveURL(/\/booking/);
    });

    test('予約履歴リンクが機能する', async ({ authenticatedPage }) => {
      const mypage = new MypagePage(authenticatedPage);
      await mypage.goto();
      await mypage.goToReservationHistory();

      await expect(authenticatedPage).toHaveURL(/\/mypage\/reservations/);
    });
  });

  test.describe('予約履歴', () => {
    test('予約履歴ページが表示される', async ({ authenticatedPage }) => {
      const historyPage = new ReservationHistoryPage(authenticatedPage);
      await historyPage.goto();
      await historyPage.expectHistoryVisible();
    });

    test('予約をキャンセルできる', async ({ authenticatedPage }) => {
      const historyPage = new ReservationHistoryPage(authenticatedPage);
      await historyPage.goto();

      // キャンセル可能な予約がある場合
      const cancelButtons = authenticatedPage.locator('button:has-text("キャンセル")');
      if (await cancelButtons.count() > 0) {
        await historyPage.cancelReservation(0);
        await historyPage.expectCancelledReservation();
      }
    });
  });
});

test.describe('マイページ - 認証チェック', () => {
  test('未ログインユーザーはマイページにアクセスできない', async ({ page }) => {
    await page.goto('/mypage');

    // ログインページにリダイレクト
    await expect(page).toHaveURL(/\/login|\/register/);
  });

  test('未ログインユーザーは予約履歴にアクセスできない', async ({ page }) => {
    await page.goto('/mypage/reservations');

    // ログインページにリダイレクト
    await expect(page).toHaveURL(/\/login|\/register/);
  });
});
