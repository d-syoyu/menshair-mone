import { test, expect } from "@playwright/test";

test("SOGA portfolio return survives navigation and reload", async ({ page, context }) => {
  const button = page.getByRole("link", { name: "SOGAに戻る", exact: true });
  await page.goto("/privacy?soga_portfolio=invalid");
  await expect(page.locator("main")).toBeVisible({ timeout: 60000 });
  await expect(button).toHaveCount(0);
  await page.goto("/privacy?soga_portfolio=1");
  await expect(button).toBeVisible();
  await page.getByRole("link", { name: /利用規約/ }).first().click();
  await expect(button).toBeVisible();
  await page.reload();
  await expect(button).toBeVisible();
  const otherTab = await context.newPage();
  await otherTab.goto("/privacy");
  await expect(otherTab.getByRole("link", { name: "SOGAに戻る", exact: true })).toHaveCount(0);
  await otherTab.close();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(button).toBeInViewport();
  await page.route("https://www.soga.ltd/**", route => route.fulfill({ body: "SOGA" }));
  await button.click();
  await expect(page).toHaveURL("https://www.soga.ltd/#portfolio");
});

test("direct visits clear previous portfolio state", async ({ page }) => {
  const button = page.getByRole("link", { name: "SOGAに戻る", exact: true });
  await page.goto("/privacy?soga_portfolio=1");
  await expect(button).toBeVisible();
  await page.goto("/privacy");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("soga-portfolio-visit-v2"))).toBeNull();
  await expect(button).toHaveCount(0);
  await page.reload();
  await expect(button).toHaveCount(0);
});

test("legacy stored visits do not display the button", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("soga-portfolio-visit", "1"));
  await page.goto("/privacy");
  await page.reload();
  await expect(page.getByRole("link", { name: "SOGAに戻る", exact: true })).toHaveCount(0);
});

test("SOGA return works when session storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("blocked"); } });
  });
  await page.goto("/privacy?soga_portfolio=1");
  await expect(page.getByRole("link", { name: "SOGAに戻る", exact: true })).toBeVisible();
  await page.getByRole("link", { name: /利用規約/ }).first().click();
  await expect(page.getByRole("link", { name: "SOGAに戻る", exact: true })).toBeVisible();
});
