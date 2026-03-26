import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { SiteShell } from "@/components/layout/site-shell";
import { LanguageProvider } from "@/components/layout/language-provider";
import {
  readWebSessionToken,
  SELLEROS_SESSION_COOKIE
} from "@/lib/auth/session-bridge";

export const metadata: Metadata = {
  title: "Agent Service x402",
  description:
    "Agent Service x402 offers x402 pay-per-use API services for agents, with a separate provider entry for packaging existing APIs into agent-ready services."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SELLEROS_SESSION_COOKIE);
  const session = sessionCookie ? readWebSessionToken(sessionCookie.value) : null;

  return (
    <html lang="zh-CN">
      <body>
        <LanguageProvider>
          <SiteShell session={session}>{children}</SiteShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
