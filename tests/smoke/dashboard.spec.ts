import { rmSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

test("dashboard renders the user-facing activity view", async ({ page }) => {
  rmSync(join(process.cwd(), ".selleros", "payment-events.json"), {
    force: true
  });
  rmSync(join(process.cwd(), ".selleros", "payment-attempts.json"), {
    force: true
  });

  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Payments, calls, and receipts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent payments and receipts" })).toBeVisible();
  await expect(
    page.getByText(
      "No payment or delivery record is available yet. Browse the directory first, then let the agent invoke a service."
    )
  ).toBeVisible();
});
