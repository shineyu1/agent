import type { Page } from "@playwright/test";
import { createWebSessionToken, SELLEROS_SESSION_COOKIE } from "@/lib/auth/session-bridge";

function ensureEncryptionKey() {
  process.env.APP_ENCRYPTION_KEY ||= "local-dev-app-encryption-key-for-selleros-x402";
}

export function buildSellerSessionCookie(
  providerSlug = "provider_demo",
  walletAddress = "0xseller111111111111111111111111111111111111"
) {
  ensureEncryptionKey();
  const session = createWebSessionToken({
    role: "seller",
    walletAddress,
    redirectTo: "/providers",
    providerSlug
  });

  return `${SELLEROS_SESSION_COOKIE}=${encodeURIComponent(session.sessionToken)}`;
}

export async function seedSellerSession(page: Page, providerSlug = "provider_demo") {
  ensureEncryptionKey();
  const session = createWebSessionToken({
    role: "seller",
    walletAddress: "0xseller111111111111111111111111111111111111",
    redirectTo: "/providers",
    providerSlug
  });

  await page.context().addCookies([
    {
      name: SELLEROS_SESSION_COOKIE,
      value: session.sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax"
    }
  ]);
}
