import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * 管理画面ダッシュボード
 */
export class AdminDashboardPage extends BasePage {
  // ロケーター
  readonly pageTitle: Locator;
  readonly todayReservationsCount: Locator;
  readonly weekReservationsCount: Locator;
  readonly totalReservationsCount: Locator;
  readonly quickLinks: Locator;
  readonly reservationTimeline: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('h1, h2').filter({ hasText: /ダッシュボード|管理/ });
    this.todayReservationsCount = page.locator('[data-stat="today"]');
    this.weekReservationsCount = page.locator('[data-stat="week"]');
    this.totalReservationsCount = page.locator('[data-stat="total"]');
    this.quickLinks = page.locator('[data-section="quick-links"], .quick-links');
    this.reservationTimeline = page.locator('[data-section="timeline"], .timeline');
    this.logoutButton = page.locator('button:has-text("ログアウト"), a:has-text("ログアウト")');
  }

  /**
   * ダッシュボードへ移動
   */
  async goto(): Promise<void> {
    await this.page.goto('/admin');
  }

  /**
   * ダッシュボードが表示されていることを確認
   */
  async expectDashboardVisible(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  /**
   * 予約管理へ移動
   */
  async navigateToReservations(): Promise<void> {
    await this.page.click('a[href="/admin/reservations"], a:has-text("予約管理")');
    await this.page.waitForURL('**/admin/reservations');
  }

  /**
   * メニュー管理へ移動
   */
  async navigateToMenus(): Promise<void> {
    await this.page.click('a[href="/admin/menus"], a:has-text("メニュー管理")');
    await this.page.waitForURL('**/admin/menus');
  }

  /**
   * 顧客管理へ移動
   */
  async navigateToCustomers(): Promise<void> {
    await this.page.click('a[href="/admin/customers"], a:has-text("顧客管理")');
    await this.page.waitForURL('**/admin/customers');
  }

  /**
   * POS管理へ移動
   */
  async navigateToPOS(): Promise<void> {
    await this.page.click('a[href*="/admin/pos"], a:has-text("POS"), a:has-text("売上")');
    await this.page.waitForURL('**/admin/pos**');
  }

  /**
   * 不定休設定へ移動
   */
  async navigateToHolidays(): Promise<void> {
    await this.page.click('a[href="/admin/holidays"], a:has-text("不定休")');
    await this.page.waitForURL('**/admin/holidays');
  }

  /**
   * ログアウト
   */
  async logout(): Promise<void> {
    await this.logoutButton.click();
    // ログインページへのリダイレクトを待機
    await this.page.waitForURL('**/login**');
  }

  /**
   * 本日の予約カードをクリック
   */
  async clickTodayReservation(index: number = 0): Promise<void> {
    const reservationCards = this.page.locator('[data-reservation], .reservation-card');
    await reservationCards.nth(index).click();
  }

  /**
   * 予約ステータスを変更
   */
  async changeReservationStatus(reservationId: string, status: 'CANCELLED' | 'NO_SHOW' | 'CONFIRMED'): Promise<void> {
    const reservation = this.page.locator(`[data-reservation-id="${reservationId}"]`);
    const statusButton = reservation.locator(`button:has-text("${status === 'CANCELLED' ? 'キャンセル' : status === 'NO_SHOW' ? '無断キャンセル' : '復元'}")`);
    await statusButton.click();
  }
}
