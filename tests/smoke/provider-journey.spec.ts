import { expect, test } from "@playwright/test";

test("provider path stays on skill installation guidance", async ({ page }) => {
  await page.goto("/providers/new");
  await page.getByRole("button").filter({ hasText: /EN/ }).click();

  await expect(page).toHaveURL(/\/providers$/);
  await expect(page.getByRole("heading", { name: "Add x402 to your API" })).toBeVisible();
  await expect(
    page.getByText(
      "npx skills add https://github.com/shineyu1/agent/tree/main/skills --skill seller-skill"
    )
  ).toBeVisible();
  await expect(page.getByText("npx skills add okx/onchainos-skills")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Three steps" })).toBeVisible();
});
