import { expect, test } from "@playwright/test";

test("provider routes render the current provider and directory pages", async ({ page }) => {
  await page.goto("/providers");
  await page.getByRole("button").filter({ hasText: /EN/ }).click();
  await expect(page.getByRole("heading", { name: "Add x402 to your API" })).toBeVisible();
  await expect(
    page.getByText(
      "npx skills add https://github.com/shineyu1/agent/tree/main/skills --skill seller-skill"
    )
  ).toBeVisible();

  await page.goto("/providers/new");
  await expect(page).toHaveURL(/\/providers$/);
  await expect(page.getByRole("heading", { name: "Add x402 to your API" })).toBeVisible();

  await page.goto("/directory");
  await expect(page.getByRole("heading", { name: "API capabilities with x402" })).toBeVisible();
  await expect(page.getByText("GPT-5.4")).toBeVisible();
});
