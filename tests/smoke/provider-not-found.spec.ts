import { expect, test } from "@playwright/test";

test("missing provider slug resolves to not-found page", async ({ page }) => {
  await page.goto("/providers/missing-service-slug");
  await expect(page.getByRole("heading", { name: "没有找到这个页面或服务" })).toBeVisible();
});
