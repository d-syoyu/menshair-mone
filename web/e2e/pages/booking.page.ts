import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 予約ページ（メニュー選択・日時選択）
 */
export class BookingPage extends BasePage {
  // メニュー選択関連
  readonly categoryTiles: Locator;
  readonly menuItems: Locator;
  readonly selectedMenusSummary: Locator;
  readonly totalPrice: Locator;
  readonly totalDuration: Locator;
  readonly clearButton: Locator;
  readonly nextButton: Locator;

  // 日時選択関連
  readonly calendar: Locator;
  readonly calendarDays: Locator;
  readonly prevMonthButton: Locator;
  readonly nextMonthButton: Locator;
  readonly timeSlots: Locator;
  readonly selectedDate: Locator;
  readonly selectedTime: Locator;
  readonly backButton: Locator;

  // ステップインジケーター
  readonly stepIndicator: Locator;
  readonly currentStep: Locator;

  constructor(page: Page) {
    super(page);

    // メニュー選択
    this.categoryTiles = page.locator('[data-category], .category-tile');
    this.menuItems = page.locator('[data-menu], .menu-item');
    this.selectedMenusSummary = page.locator('[data-selected-menus], .selected-menus');
    this.totalPrice = page.locator('[data-total-price], .total-price');
    this.totalDuration = page.locator('[data-total-duration], .total-duration');
    this.clearButton = page.locator('button:has-text("クリア"), button:has-text("選択解除")');
    this.nextButton = page.locator('button:has-text("日時を選択"), button:has-text("次へ")');

    // 日時選択
    this.calendar = page.locator('[data-calendar], .calendar');
    this.calendarDays = page.locator('[data-calendar-day], .calendar-day');
    this.prevMonthButton = page.locator('[data-prev-month], button:has-text("前月")');
    this.nextMonthButton = page.locator('[data-next-month], button:has-text("翌月")');
    this.timeSlots = page.locator('[data-time-slot], .time-slot');
    this.selectedDate = page.locator('[data-selected-date], .selected-date');
    this.selectedTime = page.locator('[data-selected-time], .selected-time');
    this.backButton = page.locator('button:has-text("戻る")');

    // ステップ
    this.stepIndicator = page.locator('[data-step-indicator], .step-indicator');
    this.currentStep = page.locator('[data-current-step], .current-step');
  }

  /**
   * 予約ページへ移動
   */
  async goto(): Promise<void> {
    await this.page.goto('/booking');
  }

  /**
   * カテゴリをクリックしてメニュー展開
   */
  async selectCategory(categoryName: string): Promise<void> {
    const category = this.page.locator(`[data-category="${categoryName}"], .category-tile:has-text("${categoryName}")`);
    await category.click();
  }

  /**
   * メニューを選択
   */
  async selectMenu(menuName: string): Promise<void> {
    const menu = this.page.locator(`[data-menu="${menuName}"], .menu-item:has-text("${menuName}")`);
    await menu.click();
  }

  /**
   * 複数メニューを選択
   */
  async selectMenus(menuNames: string[]): Promise<void> {
    for (const menuName of menuNames) {
      await this.selectMenu(menuName);
      // メニュー選択後の反映を待機
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * 選択サマリーの合計金額を確認
   */
  async expectTotalPrice(price: string): Promise<void> {
    await expect(this.page.locator('text=' + price)).toBeVisible();
  }

  /**
   * 選択をクリア
   */
  async clearSelection(): Promise<void> {
    if (await this.clearButton.isVisible()) {
      await this.clearButton.click();
    }
  }

  /**
   * 日時選択ステップへ進む
   */
  async proceedToDateTimeSelection(): Promise<void> {
    await this.nextButton.click();
    // 日時選択画面への遷移を待機
    await this.page.waitForTimeout(500);
  }

  /**
   * 日付を選択
   */
  async selectDate(date: Date | string): Promise<void> {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const day = new Date(dateStr).getDate();

    // 対象の日付をクリック
    const dayButton = this.page.locator(`[data-date="${dateStr}"], button:has-text("${day}"):not([disabled])`).first();
    await dayButton.click();

    // 空き時間の取得を待機
    await this.page.waitForTimeout(1000);
  }

  /**
   * 時間スロットを選択
   */
  async selectTimeSlot(time: string): Promise<void> {
    const slot = this.page.locator(`[data-time="${time}"], button:has-text("${time}")`).first();
    await slot.click();
  }

  /**
   * 確認画面へ進む
   */
  async proceedToConfirmation(): Promise<void> {
    const confirmButton = this.page.locator('button:has-text("予約内容を確認"), button:has-text("確認")');
    await confirmButton.click();
    await this.page.waitForURL('**/booking/confirm**');
  }

  /**
   * 選択可能な日付があることを確認
   */
  async expectAvailableDates(): Promise<void> {
    const availableDays = this.page.locator('[data-calendar-day]:not([disabled]), .calendar-day:not(.disabled)');
    await expect(availableDays.first()).toBeVisible();
  }

  /**
   * 空き時間スロットがあることを確認
   */
  async expectAvailableTimeSlots(): Promise<void> {
    await expect(this.timeSlots.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * メニュー選択画面に戻る
   */
  async goBackToMenuSelection(): Promise<void> {
    await this.backButton.click();
  }
}

/**
 * 予約確認ページ
 */
export class BookingConfirmPage extends BasePage {
  readonly menuSummary: Locator;
  readonly dateSummary: Locator;
  readonly timeSummary: Locator;
  readonly totalPrice: Locator;
  readonly noteInput: Locator;
  readonly couponInput: Locator;
  readonly couponApplyButton: Locator;
  readonly couponDiscount: Locator;
  readonly confirmButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);

    this.menuSummary = page.locator('[data-menu-summary], .menu-summary');
    this.dateSummary = page.locator('[data-date-summary], .date-summary');
    this.timeSummary = page.locator('[data-time-summary], .time-summary');
    this.totalPrice = page.locator('[data-total-price], .total-price');
    this.noteInput = page.locator('textarea#note, textarea[placeholder*="施術に関する"]');
    this.couponInput = page.locator('input[name="couponCode"], input[placeholder*="クーポン"]');
    this.couponApplyButton = page.locator('button:has-text("適用")');
    this.couponDiscount = page.locator('[data-coupon-discount], .coupon-discount');
    this.confirmButton = page.locator('button:has-text("予約を確定"), button:has-text("確定")');
    this.backButton = page.locator('button:has-text("戻る")');
  }

  /**
   * 確認ページへ移動
   */
  async goto(): Promise<void> {
    await this.page.goto('/booking/confirm');
  }

  /**
   * ご要望を入力
   */
  async enterNote(note: string): Promise<void> {
    await this.noteInput.fill(note);
  }

  /**
   * クーポンコードを適用
   */
  async applyCoupon(code: string): Promise<void> {
    await this.couponInput.fill(code);
    await this.couponApplyButton.click();
  }

  /**
   * 予約を確定
   */
  async confirmReservation(): Promise<void> {
    await this.confirmButton.click();
    await this.page.waitForURL('**/booking/complete**');
  }

  /**
   * 予約内容が正しいことを確認
   */
  async expectReservationDetails(details: { menus?: string[]; date?: string; time?: string }): Promise<void> {
    if (details.menus) {
      for (const menu of details.menus) {
        await expect(this.page.getByText(menu)).toBeVisible();
      }
    }
    if (details.date) {
      await expect(this.page.getByText(details.date)).toBeVisible();
    }
    if (details.time) {
      await expect(this.page.getByText(details.time)).toBeVisible();
    }
  }
}

/**
 * 予約完了ページ
 */
export class BookingCompletePage extends BasePage {
  readonly completeMessage: Locator;
  readonly reservationDetails: Locator;
  readonly mypageButton: Locator;
  readonly homeButton: Locator;

  constructor(page: Page) {
    super(page);

    this.completeMessage = page.locator('h1:has-text("完了"), h2:has-text("完了"), .complete-message');
    this.reservationDetails = page.locator('[data-reservation-details], .reservation-details');
    this.mypageButton = page.locator('a[href="/mypage"], button:has-text("マイページ")');
    this.homeButton = page.locator('a[href="/"], button:has-text("トップ")');
  }

  /**
   * 完了ページへ移動
   */
  async goto(): Promise<void> {
    await this.page.goto('/booking/complete');
  }

  /**
   * 予約完了メッセージを確認
   */
  async expectCompletionMessage(): Promise<void> {
    await expect(this.completeMessage).toBeVisible();
  }

  /**
   * マイページへ移動
   */
  async goToMypage(): Promise<void> {
    await this.mypageButton.click();
    await this.page.waitForURL('**/mypage**');
  }

  /**
   * トップページへ移動
   */
  async goToHome(): Promise<void> {
    await this.homeButton.click();
    await this.page.waitForURL('/');
  }
}
