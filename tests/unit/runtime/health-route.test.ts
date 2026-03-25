import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getHealth } from "@/app/api/health/route";

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    $queryRaw: vi.fn()
  }
}));

vi.mock("@/lib/db/client", () => ({ db: dbMock }));

describe("/api/health", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    dbMock.$queryRaw.mockReset();
  });

  it("returns ready when database ping succeeds and required env is present", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/selleros");
    vi.stubEnv("APP_ENCRYPTION_KEY", "test-encryption-key");
    vi.stubEnv("PAYMENT_API_BASE_URL", "https://web3.okx.com");
    vi.stubEnv("PAYMENT_API_KEY", "key");
    vi.stubEnv("PAYMENT_API_SECRET", "secret");
    vi.stubEnv("PAYMENT_API_PASSPHRASE", "passphrase");
    vi.stubEnv("PAYMENT_VERIFY_BYPASS", "false");
    vi.stubEnv("PAYMENT_SETTLE_ONCHAIN", "true");
    dbMock.$queryRaw.mockResolvedValue([{ healthcheck: 1 }]);

    const response = await getHealth();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe("ready");
    expect(payload.checks.database.status).toBe("pass");
  });

  it("returns degraded when database ping fails", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/selleros");
    vi.stubEnv("APP_ENCRYPTION_KEY", "test-encryption-key");
    vi.stubEnv("PAYMENT_VERIFY_BYPASS", "true");
    vi.stubEnv("PAYMENT_SETTLE_ONCHAIN", "false");
    dbMock.$queryRaw.mockRejectedValue(new Error("db down"));

    const response = await getHealth();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.status).toBe("degraded");
    expect(payload.checks.database.status).toBe("fail");
    expect(payload.checks.paymentVerification.status).toBe("warn");
  });
});
