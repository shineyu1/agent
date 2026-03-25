import { expect, test } from "@playwright/test";

test("homepage updates simplified copy when language is toggled", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("home-hero")).toBeVisible();
  await expect(page.getByRole("heading", { name: "让 Agent 直接调用 x402 服务" })).toBeVisible();
  await expect(page.getByRole("link", { name: "查看可用服务" })).toBeVisible();
  await expect(page.getByRole("link", { name: "接入我的 API" })).toBeVisible();
  await expect(page.getByRole("button", { name: "复制安装命令" })).toBeVisible();

  await page.getByRole("button", { name: /语言|Language/ }).click();

  await expect(page.getByRole("heading", { name: "Let your agent call x402 services" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse services" })).toBeVisible();
  await expect(page.getByRole("link", { name: "List my API" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy install commands" })).toBeVisible();
});
