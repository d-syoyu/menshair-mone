import { test, expect } from '../../fixtures/auth.fixture';

function getJstDateString(offsetDays = 0): string {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function collectRuntimeErrors(page: import('@playwright/test').Page): string[] {
  const runtimeErrors: string[] = [];

  page.on('pageerror', (error) => {
    runtimeErrors.push(error.message);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeErrors.push(message.text());
    }
  });

  return runtimeErrors;
}

test.describe('管理画面 - POS', () => {
  test('POSダッシュボードが表示され、主要リンクと集計APIが機能する', async ({ adminPage }) => {
    const runtimeErrors = collectRuntimeErrors(adminPage);
    const dashboardResponse = adminPage.waitForResponse((response) =>
      response.url().includes('/api/admin/pos/dashboard')
    );

    await adminPage.goto('/admin/pos');
    const response = await dashboardResponse;

    expect(response.ok()).toBeTruthy();
    await expect(adminPage).toHaveURL(/\/admin\/pos$/);
    await expect(adminPage.locator('h1, h2').filter({ hasText: /POS/ })).toBeVisible();
    await expect(adminPage.locator('a[href="/admin/pos/sales/new"]')).toBeVisible();
    await expect(adminPage.locator('a[href="/admin/pos/reports"]')).toBeVisible();
    await expect(adminPage.locator('a[href="/admin/pos/coupons"]')).toBeVisible();
    await expect(adminPage.locator('a[href="/admin/pos/settings"]')).toBeVisible();
    await expect(adminPage.locator('text=/¥|円/').first()).toBeVisible();

    expect(runtimeErrors).toEqual([]);
  });

  test('売上レポートの日付・月別・分析タブが表示される', async ({ adminPage }) => {
    const runtimeErrors = collectRuntimeErrors(adminPage);
    const dailyResponse = adminPage.waitForResponse((response) =>
      response.url().includes('/api/admin/reports/daily')
    );

    await adminPage.goto('/admin/pos/reports');
    expect((await dailyResponse).ok()).toBeTruthy();

    const dailyDateInput = adminPage.locator('input[type="date"]').first();
    await expect(dailyDateInput).toHaveValue(getJstDateString());

    const previousDate = getJstDateString(-1);
    const previousDailyResponse = adminPage.waitForResponse((response) =>
      response.url().includes(`/api/admin/reports/daily?date=${previousDate}`)
    );
    await dailyDateInput.fill(previousDate);
    expect((await previousDailyResponse).ok()).toBeTruthy();
    await expect(dailyDateInput).toHaveValue(previousDate);

    const monthlyResponse = adminPage.waitForResponse((response) =>
      response.url().includes('/api/admin/reports/monthly')
    );
    await adminPage.getByRole('button', { name: '月別' }).click();
    expect((await monthlyResponse).ok()).toBeTruthy();
    await expect(adminPage.locator('select')).toHaveCount(2);

    const analyticsResponse = adminPage.waitForResponse((response) =>
      response.url().includes('/api/admin/analytics')
    );
    await adminPage.getByRole('button', { name: '詳細分析' }).click();
    expect((await analyticsResponse).ok()).toBeTruthy();

    const presetResponse = adminPage.waitForResponse((response) =>
      response.url().includes('/api/admin/analytics')
    );
    await adminPage.getByRole('button', { name: '7日間' }).click();
    expect((await presetResponse).ok()).toBeTruthy();
    await expect(adminPage.locator('input[type="date"]').last()).toHaveValue(getJstDateString());

    expect(runtimeErrors).toEqual([]);
  });

  test('クーポン管理の追加モーダルでJSTの日付初期値が入る', async ({ adminPage }) => {
    const runtimeErrors = collectRuntimeErrors(adminPage);
    const couponsResponse = adminPage.waitForResponse((response) =>
      response.url().includes('/api/admin/coupons')
    );

    await adminPage.goto('/admin/pos/coupons');
    expect((await couponsResponse).ok()).toBeTruthy();

    await adminPage.getByRole('button', { name: 'クーポンを追加' }).click();
    const modal = adminPage.locator('[role="dialog"], .fixed.inset-0').first();
    await expect(modal).toBeVisible();

    const dateInputs = adminPage.locator('input[type="date"]');
    await expect(dateInputs.first()).toHaveValue(getJstDateString());
    await expect(dateInputs.nth(1)).toHaveValue(getJstDateString(31));

    await adminPage.getByRole('button', { name: 'キャンセル' }).click();
    await expect(modal).toBeHidden();

    expect(runtimeErrors).toEqual([]);
  });

  test('ウォークイン会計を登録できる', async ({ adminPage }) => {
    const runtimeErrors = collectRuntimeErrors(adminPage);
    const customerName = `E2E POS ${Date.now()}`;
    const bootstrapResponse = adminPage.waitForResponse((response) =>
      response.url().includes('/api/admin/pos/bootstrap')
    );

    await adminPage.goto('/admin/pos/sales/new');
    expect((await bootstrapResponse).ok()).toBeTruthy();
    await expect(adminPage.locator('h1, h2').filter({ hasText: /新規会計登録/ })).toBeVisible();

    await adminPage.getByRole('button', { name: 'ウォークイン' }).click();
    await adminPage.getByPlaceholder('例: 田中太郎').fill(customerName);
    await adminPage.locator('button').filter({ hasText: '次へ：メニュー選択' }).click();

    const menuSection = adminPage.locator('h2').filter({ hasText: /施術メニュー/ }).locator('..');
    await expect(menuSection).toBeVisible();
    await menuSection.locator('.border > button').first().click();
    await menuSection.locator('input[type="checkbox"]').first().check();
    await adminPage.getByRole('button', { name: '次へ：店販商品' }).click();
    await adminPage.getByRole('button', { name: '次へ：割引・クーポン' }).click();
    await adminPage.getByRole('button', { name: '次へ：支払・確認' }).click();

    await adminPage.getByRole('button', { name: '全額' }).click();

    const saleResponse = adminPage.waitForResponse((response) =>
      response.url().endsWith('/api/admin/sales') && response.request().method() === 'POST'
    );
    await adminPage.getByRole('button', { name: '会計を登録する' }).click();
    expect((await saleResponse).status()).toBe(201);

    await expect(adminPage).toHaveURL(/\/admin\/pos\/sales$/);
    await expect(adminPage.getByText(customerName)).toBeVisible();

    expect(runtimeErrors).toEqual([]);
  });
});
