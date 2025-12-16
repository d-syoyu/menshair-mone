import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * マイページ
 */
export class MypagePage extends BasePage {
  // ロケーター
  readonly pageTitle: Locator;
  readonly userName: Locator;
  readonly userEmail: Locator;
  readonly newReservationButton: Locator;
  readonly reservationHistoryLink: Locator;
  readonly upcomingReservations: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('h1, h2').filter({ hasText: /マイページ/ });
    this.userName = page.locator('[data-user-name], .user-name');
    this.userEmail = page.locator('[data-user-email], .user-email');
    this.newReservationButton = page.locator('a[href="/booking"], button:has-text("新規予約")');
    this.reservationHistoryLink = page.locator('a[href*="reservations"], a:has-text("予約履歴")');
    this.upcomingReservations = page.locator('[data-upcoming-reservations], .upcoming-reservations');
    this.logoutButton = page.locator('button:has-text("ログアウト")');
  }

  /**
   * マイページへ移動
   */
  async goto(): Promise<void> {
    await this.page.goto('/mypage');
  }

  /**
   * マイページが表示されていることを確認
   */
  async expectMypageVisible(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  /**
   * 新規予約へ移動
   */
  async goToNewReservation(): Promise<void> {
    await this.newReservationButton.click();
    await this.page.waitForURL('**/booking**');
  }

  /**
   * 予約履歴へ移動
   */
  async goToReservationHistory(): Promise<void> {
    await this.reservationHistoryLink.click();
    await this.page.waitForURL('**/mypage/reservations**');
  }

  /**
   * ログアウト
   */
  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  /**
   * 直近の予約があることを確認
   */
  async expectUpcomingReservations(): Promise<void> {
    await expect(this.upcomingReservations).toBeVisible();
  }
}

/**
 * 予約履歴ページ
 */
export class ReservationHistoryPage extends BasePage {
  readonly pageTitle: Locator;
  readonly reservationList: Locator;
  readonly reservationCards: Locator;
  readonly cancelButtons: Locator;
  readonly cancelConfirmModal: Locator;
  readonly cancelConfirmButton: Locator;
  readonly cancelCancelButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('h1, h2').filter({ hasText: /予約履歴/ });
    this.reservationList = page.locator('[data-reservation-list], .reservation-list');
    this.reservationCards = page.locator('[data-reservation], .reservation-card');
    this.cancelButtons = page.locator('button:has-text("キャンセル")');
    this.cancelConfirmModal = page.locator('[data-modal="cancel"], .cancel-modal, [role="dialog"]');
    this.cancelConfirmButton = page.locator('button:has-text("キャンセルする"), button:has-text("はい")');
    this.cancelCancelButton = page.locator('button:has-text("戻る"), button:has-text("いいえ")');
  }

  /**
   * 予約履歴ページへ移動
   */
  async goto(): Promise<void> {
    await this.page.goto('/mypage/reservations');
  }

  /**
   * 予約履歴が表示されていることを確認
   */
  async expectHistoryVisible(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  /**
   * 予約をキャンセル
   */
  async cancelReservation(index: number = 0): Promise<void> {
    const cancelButton = this.cancelButtons.nth(index);
    await cancelButton.click();

    // 確認モーダルで「キャンセルする」をクリック
    await expect(this.cancelConfirmModal).toBeVisible();
    await this.cancelConfirmButton.click();
  }

  /**
   * キャンセル済みの予約があることを確認
   */
  async expectCancelledReservation(): Promise<void> {
    await expect(this.page.getByText('キャンセル済')).toBeVisible();
  }

  /**
   * 予約数を取得
   */
  async getReservationCount(): Promise<number> {
    return this.reservationCards.count();
  }

  /**
   * 予約ステータスを確認
   */
  async expectReservationStatus(index: number, status: string): Promise<void> {
    const card = this.reservationCards.nth(index);
    await expect(card.getByText(status)).toBeVisible();
  }
}
