import { expect, test } from "@playwright/test";
import { buildSellerSessionCookie } from "./helpers/session";

test("service detail page renders a consumer decision page", async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const serviceName = `Aurora Search ${suffix}`;

  const response = await page.request.post("/api/providers/services", {
    headers: {
      cookie: buildSellerSessionCookie("provider_1")
    },
    data: {
      providerId: "provider_1",
      serviceName,
      description: "Fast semantic search for agent workflows.",
      category: "search",
      tags: ["search", "agent"],
      inputSchema: { query: "string" },
      outputSchema: { results: "array" },
      priceAmount: "0.05",
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
        upstreamUrl: "https://provider.example.com/search"
      },
      access: {
        mode: "hosted",
        authType: "bearer",
        secretCipher: "ciphertext"
      }
    }
  });

  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { slug?: string };
  const slug = payload.slug ?? `aurora-search-${suffix}`;

  await page.goto(`/services/${slug}`);

  await expect(page.getByRole("heading", { name: serviceName })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What this service is good for" })).toBeVisible();
  await expect(page.getByText("x402 call loop")).toBeVisible();
  await expect(page.locator("pre").filter({ hasText: `POST /api/services/${slug}` })).toBeVisible();
  await expect(page.getByText("No paid call or delivery record is available yet.")).toBeVisible();
});
