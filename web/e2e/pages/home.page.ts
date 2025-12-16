import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * トップページ
 */
export class HomePage extends BasePage {
  // ロケーター
  readonly heroSection: Locator;
  readonly heroTitle: Locator;
  readonly conceptSection: Locator;
  readonly menuSection: Locator;
  readonly newsSection: Locator;
  readonly accessSection: Locator;
  readonly reservationButton: Locator;
  readonly menuLink: Locator;
  readonly newsLink: Locator;

  constructor(page: Page) {
    super(page);

    this.heroSection = page.locator('[data-section="hero"], .hero-section, section').first();
    this.heroTitle = page.locator('h1, .hero-title');
    this.conceptSection = page.locator('[data-section="concept"], #concept');
    this.menuSection = page.locator('[data-section="menu"], #menu');
    this.newsSection = page.locator('[data-section="news"], #news');
    this.accessSection = page.locator('[data-section="access"], #access');
    this.reservationButton = page.locator('a[href="/booking"], a:has-text("予約"), button:has-text("予約")');
    this.menuLink = page.locator('a[href="/menu"]');
    this.newsLink = page.locator('a[href="/news"]');
  }

  /**
   * トップページへ移動
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * トップページが表示されていることを確認
   */
  async expectHomeVisible(): Promise<void> {
    await expect(this.heroSection).toBeVisible();
  }

  /**
   * 各セクションが表示されていることを確認
   */
  async expectAllSectionsVisible(): Promise<void> {
    await expect(this.heroSection).toBeVisible();
    // コンセプトセクションまでスクロール
    await this.conceptSection.scrollIntoViewIfNeeded();
    await expect(this.conceptSection).toBeVisible();
  }

  /**
   * 予約ページへ移動
   */
  async goToBooking(): Promise<void> {
    await this.reservationButton.first().click();
    await this.page.waitForURL('**/booking**');
  }

  /**
   * メニューページへ移動
   */
  async goToMenu(): Promise<void> {
    await this.menuLink.first().click();
    await this.page.waitForURL('**/menu**');
  }

  /**
   * ニュースページへ移動
   */
  async goToNews(): Promise<void> {
    await this.newsLink.first().click();
    await this.page.waitForURL('**/news**');
  }

  /**
   * ナビゲーションが機能することを確認
   */
  async expectNavigationWorks(): Promise<void> {
    // ヘッダーの存在確認
    await this.expectHeaderVisible();

    // ナビゲーションリンクの確認
    await expect(this.page.locator('nav, header').locator('a[href="/menu"]')).toBeVisible();
    await expect(this.page.locator('nav, header').locator('a[href="/news"]')).toBeVisible();
  }
}

/**
 * メニューページ
 */
export class MenuPage extends BasePage {
  readonly pageTitle: Locator;
  readonly categoryList: Locator;
  readonly menuList: Locator;
  readonly menuItems: Locator;
  readonly reservationButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('h1, h2').filter({ hasText: /メニュー|MENU/ });
    this.categoryList = page.locator('[data-categories], .category-list');
    this.menuList = page.locator('[data-menus], .menu-list');
    this.menuItems = page.locator('[data-menu], .menu-item');
    this.reservationButton = page.locator('a[href="/booking"], button:has-text("予約")');
  }

  /**
   * メニューページへ移動
   */
  async goto(): Promise<void> {
    await this.page.goto('/menu');
  }

  /**
   * メニューページが表示されていることを確認
   */
  async expectMenuPageVisible(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  /**
   * メニューが表示されていることを確認
   */
  async expectMenusLoaded(): Promise<void> {
    // メニューアイテムが1つ以上表示されていることを確認
    await expect(this.menuItems.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * メニュー価格が表示されていることを確認
   */
  async expectPricesVisible(): Promise<void> {
    // 価格表示（¥記号）があることを確認
    await expect(this.page.getByText(/¥\d+/)).toBeVisible();
  }

  /**
   * 予約ページへ移動
   */
  async goToBooking(): Promise<void> {
    await this.reservationButton.first().click();
    await this.page.waitForURL('**/booking**');
  }
}

/**
 * ニュースページ
 */
export class NewsPage extends BasePage {
  readonly pageTitle: Locator;
  readonly newsList: Locator;
  readonly newsItems: Locator;
  readonly categoryFilters: Locator;
  readonly loadMoreButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('h1, h2').filter({ hasText: /お知らせ|NEWS/ });
    this.newsList = page.locator('[data-news-list], .news-list');
    this.newsItems = page.locator('[data-news-item], .news-item, article');
    this.categoryFilters = page.locator('[data-category-filter], .category-filter');
    this.loadMoreButton = page.locator('button:has-text("もっと見る")');
  }

  /**
   * ニュースページへ移動
   */
  async goto(): Promise<void> {
    await this.page.goto('/news');
  }

  /**
   * ニュースページが表示されていることを確認
   */
  async expectNewsPageVisible(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  /**
   * ニュースが表示されていることを確認
   */
  async expectNewsLoaded(): Promise<void> {
    await expect(this.newsItems.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * カテゴリでフィルター
   */
  async filterByCategory(category: string): Promise<void> {
    const filterButton = this.page.locator(`button:has-text("${category}")`);
    await filterButton.click();
  }

  /**
   * ニュース詳細へ移動
   */
  async goToNewsDetail(index: number = 0): Promise<void> {
    await this.newsItems.nth(index).click();
    await this.page.waitForURL('**/news/**');
  }
}
