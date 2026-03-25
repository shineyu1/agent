import { expect, test } from "@playwright/test";

test("provider page now shows skill-only onboarding", async ({ page }) => {
  await page.goto("/providers");
  await page.getByRole("button").filter({ hasText: /EN/ }).click();

  await expect(page.getByRole("heading", { name: "Add x402 to your API" })).toBeVisible();
  await expect(
    page.getByText(
      "npx skills add https://github.com/shineyu1/agent/tree/main/skills --skill agent-service-layer-provider-skill"
    )
  ).toBeVisible();
  await expect(page.getByText("npx skills add okx/onchainos-skills")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Three steps" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy install commands" })).toBeVisible();
});
