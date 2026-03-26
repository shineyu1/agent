import { expect, test } from "@playwright/test";

test("provider path stays on skill installation guidance", async ({ page }) => {
  await page.goto("/providers/new");
  await page.getByRole("button").filter({ hasText: /EN/ }).click();

  await expect(page).toHaveURL(/\/providers$/);
  await expect(page.getByRole("heading", { name: "Add x402 to your API" })).toBeVisible();
  await expect(
    page.getByText(
      "npx skills add shineyu1/agent --agent openclaw --skill agent-service-layer-provider-skill -y"
    )
  ).toBeVisible();
  await expect(
    page.getByText("npx skills add okx/onchainos-skills --agent openclaw --skill '*' -y")
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Three steps" })).toBeVisible();
});
