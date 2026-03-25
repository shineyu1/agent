export type RuntimeCheckStatus = "pass" | "warn" | "fail";

export type RuntimeCheck = {
  status: RuntimeCheckStatus;
  detail: string;
};

export type RuntimeReadiness = {
  status: "ready" | "degraded";
  checks: {
    database: RuntimeCheck;
    encryption: RuntimeCheck;
    paymentVerification: RuntimeCheck;
    paymentSettlement: RuntimeCheck;
  };
};

type ReadinessInput = {
  env: Record<string, string | undefined>;
  databaseReachable: boolean;
};

export async function checkDatabaseReachability() {
  try {
    const { db } = await import("@/lib/db/client");
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

function hasPaymentVerificationConfig(env: Record<string, string | undefined>) {
  return Boolean(
    env.PAYMENT_API_BASE_URL &&
      env.PAYMENT_API_KEY &&
      env.PAYMENT_API_SECRET &&
      env.PAYMENT_API_PASSPHRASE
  );
}

export function evaluateRuntimeReadiness(input: ReadinessInput): RuntimeReadiness {
  const { env, databaseReachable } = input;
  const hasDatabaseUrl = Boolean(env.DATABASE_URL);
  const hasEncryptionKey = Boolean(env.APP_ENCRYPTION_KEY);
  const paymentVerificationBypass = env.PAYMENT_VERIFY_BYPASS === "true";
  const paymentSettlementOnchain = env.PAYMENT_SETTLE_ONCHAIN === "true";
  const paymentVerificationConfigured = hasPaymentVerificationConfig(env);

  const database: RuntimeCheck = !hasDatabaseUrl
    ? {
        status: "fail",
        detail: "DATABASE_URL is missing."
      }
    : databaseReachable
      ? {
          status: "pass",
          detail: "Database connectivity check passed."
        }
      : {
          status: "fail",
          detail: "Database connectivity check failed."
        };

  const encryption: RuntimeCheck = hasEncryptionKey
    ? {
        status: "pass",
        detail: "APP_ENCRYPTION_KEY is configured."
      }
    : {
        status: "fail",
        detail: "APP_ENCRYPTION_KEY is missing."
      };

  const paymentVerification: RuntimeCheck = paymentVerificationBypass
    ? {
        status: "warn",
        detail: "PAYMENT_VERIFY_BYPASS=true. Verification is running in local bypass mode."
      }
    : paymentVerificationConfigured
      ? {
          status: "pass",
          detail: "OKX/x402 verification credentials are configured."
        }
      : {
          status: "fail",
          detail: "OKX/x402 verification credentials are incomplete."
        };

  const paymentSettlement: RuntimeCheck = !paymentSettlementOnchain
    ? {
        status: "warn",
        detail: "PAYMENT_SETTLE_ONCHAIN=false. Onchain settlement is disabled."
      }
    : paymentVerificationConfigured
      ? {
          status: "pass",
          detail: "Onchain settlement is enabled and payment API credentials are configured."
        }
      : {
          status: "fail",
          detail: "Onchain settlement is enabled but payment API credentials are incomplete."
        };

  const status =
    database.status === "fail" ||
    encryption.status === "fail" ||
    paymentVerification.status === "fail" ||
    paymentSettlement.status === "fail"
      ? "degraded"
      : "ready";

  return {
    status,
    checks: {
      database,
      encryption,
      paymentVerification,
      paymentSettlement
    }
  };
}

export async function getRuntimeReadiness(
  env: Record<string, string | undefined> = process.env
) {
  return evaluateRuntimeReadiness({
    env,
    databaseReachable: await checkDatabaseReachability()
  });
}
