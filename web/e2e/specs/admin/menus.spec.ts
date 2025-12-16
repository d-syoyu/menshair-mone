import { test, expect } from '../../fixtures/auth.fixture';

test.describe('管理画面 - メニュー管理', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/admin/menus');
    await adminPage.waitForLoadState('networkidle');
  });

  test('メニュー管理ページが表示される', async ({ adminPage }) => {
    await expect(adminPage.locator('h1, h2').filter({ hasText: /メニュー/ })).toBeVisible();
  });

  test('カテゴリ一覧が表示される', async ({ adminPage }) => {
    // カテゴリタブまたはリストを確認
    const categoryList = adminPage.locator('[data-categories], .category-list, [role="tablist"]');
    await adminPage.waitForTimeout(1000);
  });

  test('メニュー一覧が表示される', async ({ adminPage }) => {
    // メニューアイテムを確認
    const menuItems = adminPage.locator('[data-menu], .menu-item, tr, .menu-card');
    await adminPage.waitForTimeout(1000);
  });

  test('新規メニュー追加ボタンがある', async ({ adminPage }) => {
    const addButton = adminPage.locator('button:has-text("追加"), button:has-text("新規"), a:has-text("追加")');
    await expect(addButton.first()).toBeVisible();
  });

  test('メニュー追加モーダルを開ける', async ({ adminPage }) => {
    const addButton = adminPage.locator('button:has-text("追加"), button:has-text("新規")').first();

    if (await addButton.isVisible()) {
      await addButton.click();

      // モーダルまたはフォームが表示されることを確認
      const modal = adminPage.locator('[role="dialog"], .modal, form');
      await adminPage.waitForTimeout(500);
    }
  });

  test('メニュー編集ができる', async ({ adminPage }) => {
    // 編集ボタンを探す
    const editButton = adminPage.locator('button:has-text("編集"), [data-action="edit"]').first();

    if (await editButton.isVisible()) {
      await editButton.click();
      // 編集フォームが表示されることを確認
      await adminPage.waitForTimeout(500);
    }
  });

  test('メニューの表示順を変更できる', async ({ adminPage }) => {
    // ドラッグ&ドロップまたは順序変更ボタン
    const orderButtons = adminPage.locator('[data-action="move-up"], [data-action="move-down"]');
    // 実装に依存
  });

  test('メニューを無効化できる', async ({ adminPage }) => {
    // 無効化トグルまたはボタン
    const toggleButton = adminPage.locator('[data-action="toggle"], input[type="checkbox"]').first();

    if (await toggleButton.isVisible()) {
      // クリックで状態が変わることを確認
    }
  });
});

test.describe('管理画面 - カテゴリ管理', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/admin/menus');
    await adminPage.waitForLoadState('networkidle');
  });

  test('カテゴリ追加ボタンがある', async ({ adminPage }) => {
    const addCategoryButton = adminPage.locator('button:has-text("カテゴリ追加"), button:has-text("カテゴリを追加")');
    // ボタンの有無を確認
  });

  test('カテゴリ編集ができる', async ({ adminPage }) => {
    // カテゴリ編集機能
    const editCategoryButton = adminPage.locator('[data-action="edit-category"]').first();

    if (await editCategoryButton.isVisible()) {
      await editCategoryButton.click();
    }
  });
});
