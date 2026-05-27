import { test, expect } from '../../fixtures/auth.fixture';

test.describe('公開ページ - 予約作成フロー', () => {
  test('トップページの予約導線から予約を完了できる', async ({ authenticatedPage }) => {
    const customerName = `E2E予約 ${Date.now()}`;
    const customerPhone = '090-0000-0000';

    await authenticatedPage.goto('/');
    await authenticatedPage.locator('a[href="/booking"]').first().click();
    await expect(authenticatedPage).toHaveURL(/\/booking/);
    await expect(authenticatedPage.locator('h1').filter({ hasText: /ご予約/ })).toBeVisible();

    const firstCategory = authenticatedPage.locator('.grid > div button').first();
    await expect(firstCategory).toBeVisible();
    await firstCategory.click();

    const firstMenu = authenticatedPage.locator('.absolute button').first();
    await expect(firstMenu).toBeVisible();
    await firstMenu.click();

    await authenticatedPage.getByRole('button', { name: '日時を選択' }).click();

    const availableDays = authenticatedPage.locator('.grid.grid-cols-7 button:not([disabled])');
    const maxCandidates = Math.min(await availableDays.count(), 14);
    let selectedSlot = false;

    for (let i = 0; i < maxCandidates; i++) {
      await availableDays.nth(i).click();
      await authenticatedPage.waitForTimeout(1500);

      const timeSlots = authenticatedPage
        .locator('button:not([disabled])')
        .filter({ hasText: /^\d{1,2}:\d{2}$/ });

      if ((await timeSlots.count()) > 0) {
        await timeSlots.first().click();
        selectedSlot = true;
        break;
      }
    }

    expect(selectedSlot).toBeTruthy();

    await authenticatedPage.getByRole('button', { name: '予約内容を確認' }).click();
    await expect(authenticatedPage).toHaveURL(/\/booking\/confirm/);
    await expect(authenticatedPage.locator('h1').filter({ hasText: /予約内容の確認/ })).toBeVisible();

    await authenticatedPage.locator('#customerName').fill(customerName);
    await authenticatedPage.locator('#customerPhone').fill(customerPhone);

    const reservationResponse = authenticatedPage.waitForResponse((response) =>
      response.url().includes('/api/reservations') && response.request().method() === 'POST'
    );

    await authenticatedPage.getByRole('button', { name: 'この内容で予約する' }).click();
    expect((await reservationResponse).status()).toBe(201);

    await expect(authenticatedPage).toHaveURL(/\/booking\/complete\?id=/);
    await expect(authenticatedPage.locator('h1').filter({ hasText: /ご予約完了/ })).toBeVisible();
  });
});
