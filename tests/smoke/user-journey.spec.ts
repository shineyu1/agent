import { expect, test } from "@playwright/test";
import { buildSellerSessionCookie } from "./helpers/session";

test("user can go from homepage to directory, service detail, install, and records", async ({
  page
}) => {
  const suffix = Date.now().toString().slice(-6);
  const serviceName = `Signal Lens ${suffix}`;
  const expectedSlug = `signal-lens-${suffix}`;

  const response = await page.request.post("/api/providers/services", {
    headers: {
      cookie: buildSellerSessionCookie("provider_1")
    },
    data: {
      providerId: "provider_1",
      serviceName,
      description: "Token signal snapshots for agent research workflows.",
      category: "research",
      tags: ["signals", "token"],
      inputSchema: { token: "string" },
      outputSchema: { snapshot: "object" },
      priceAmount: "0.03",
      priceCurrency: "USDT",
      payoutWallet: {
        network: "xlayer",
        address: "0x1234567890abcdef1234567890abcdef12345678"
      },
      publishing: {
        visibility: "listed"
      },
      source: {
        kind: "manual",
        method: "POST",
        upstreamUrl: "https://provider.example.com/signal"
      },
      access: {
        mode: "hosted",
        authType: "bearer",
        secretCipher: "ciphertext"
      }
    }
  });

  expect(response.ok()).toBeTruthy();

  await page.goto("/");
  await page.getByRole("button").filter({ hasText: /EN/ }).click();
  await page.getByRole("link", { name: "Browse services" }).click();
  await expect(page).toHaveURL(/\/directory/);
  await expect(page.getByRole("heading", { name: "API capabilities with x402" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Most called" })).toBeVisible();

  const serviceCard = page
    .locator("article")
    .filter({
      has: page.getByRole("heading", { name: serviceName })
    })
    .first();
  await expect(serviceCard).toBeVisible();

  await serviceCard.getByRole("link", { name: "View details" }).click();
  await expect(page).toHaveURL(new RegExp(`/services/${expectedSlug}`));
  await expect(page.getByRole("heading", { name: serviceName })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What this service is good for" })).toBeVisible();

  await page.getByRole("link", { name: "Install Skill" }).first().click();
  await expect(page).toHaveURL(/\/install/);
  await expect(page.getByRole("heading", { name: "Install the Skill, then start" })).toBeVisible();

  await page.getByRole("main").getByRole("link", { name: "View records" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Payments, calls, and receipts" })).toBeVisible();
});
