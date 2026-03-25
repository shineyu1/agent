import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as postReconcile } from "@/app/api/ops/reconcile/route";

const { reconcilePaymentFailuresMock } = vi.hoisted(() => ({
  reconcilePaymentFailuresMock: vi.fn()
}));

vi.mock("@/lib/services/operations/payment-reconciliation", () => ({
  reconcilePaymentFailures: reconcilePaymentFailuresMock
}));

describe("/api/ops/reconcile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects requests without the correct ops token", async () => {
    vi.stubEnv("OPS_API_TOKEN", "secret-token");

    const response = await postReconcile(
      new Request("http://localhost/api/ops/reconcile", {
        method: "POST"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
    expect(reconcilePaymentFailuresMock).not.toHaveBeenCalled();
  });

  it("runs reconciliation when the ops token matches", async () => {
    vi.stubEnv("OPS_API_TOKEN", "secret-token");
    reconcilePaymentFailuresMock.mockResolvedValue({
      summary: {
        scanned: 2,
        retryableCandidates: 1,
        retried: 1,
        recovered: 1,
        failedAgain: 0,
        nonRetryable: 1
      }
    });

    const response = await postReconcile(
      new Request("http://localhost/api/ops/reconcile", {
        method: "POST",
        headers: {
          authorization: "Bearer secret-token"
        }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.summary.recovered).toBe(1);
    expect(reconcilePaymentFailuresMock).toHaveBeenCalledTimes(1);
  });
});
