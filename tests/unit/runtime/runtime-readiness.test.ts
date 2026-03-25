import { describe, expect, it } from "vitest";
import { evaluateRuntimeReadiness } from "@/lib/runtime/runtime-readiness";

describe("evaluateRuntimeReadiness", () => {
  it("marks runtime ready when encryption, database, and payment verification config are present", () => {
    const readiness = evaluateRuntimeReadiness({
      env: {
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/selleros",
        APP_ENCRYPTION_KEY: "test-encryption-key",
        PAYMENT_API_BASE_URL: "https://web3.okx.com",
        PAYMENT_API_KEY: "key",
        PAYMENT_API_SECRET: "secret",
        PAYMENT_API_PASSPHRASE: "passphrase",
        PAYMENT_VERIFY_BYPASS: "false",
        PAYMENT_SETTLE_ONCHAIN: "true"
      },
      databaseReachable: true
    });

    expect(readiness.status).toBe("ready");
    expect(readiness.checks.database.status).toBe("pass");
    expect(readiness.checks.encryption.status).toBe("pass");
    expect(readiness.checks.paymentVerification.status).toBe("pass");
    expect(readiness.checks.paymentSettlement.status).toBe("pass");
  });

  it("marks runtime degraded when payment verification is missing and database is unreachable", () => {
    const readiness = evaluateRuntimeReadiness({
      env: {
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/selleros",
        APP_ENCRYPTION_KEY: "test-encryption-key",
        PAYMENT_VERIFY_BYPASS: "false",
        PAYMENT_SETTLE_ONCHAIN: "true"
      },
      databaseReachable: false
    });

    expect(readiness.status).toBe("degraded");
    expect(readiness.checks.database.status).toBe("fail");
    expect(readiness.checks.paymentVerification.status).toBe("fail");
    expect(readiness.checks.paymentSettlement.status).toBe("fail");
  });

  it("treats bypass verification as a warning instead of a hard failure", () => {
    const readiness = evaluateRuntimeReadiness({
      env: {
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/selleros",
        APP_ENCRYPTION_KEY: "test-encryption-key",
        PAYMENT_VERIFY_BYPASS: "true",
        PAYMENT_SETTLE_ONCHAIN: "false"
      },
      databaseReachable: true
    });

    expect(readiness.status).toBe("ready");
    expect(readiness.checks.paymentVerification.status).toBe("warn");
    expect(readiness.checks.paymentSettlement.status).toBe("warn");
  });
});
