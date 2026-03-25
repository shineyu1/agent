import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/dashboard/route";

const {
  getLiveDashboardSnapshotMock,
  getRuntimeReadinessMock,
  getPaymentOperationsSnapshotMock
} = vi.hoisted(() => ({
  getLiveDashboardSnapshotMock: vi.fn(),
  getRuntimeReadinessMock: vi.fn(),
  getPaymentOperationsSnapshotMock: vi.fn()
}));

vi.mock("@/lib/services/analytics/dashboard", () => ({
  getLiveDashboardSnapshot: getLiveDashboardSnapshotMock
}));

vi.mock("@/lib/runtime/runtime-readiness", () => ({
  getRuntimeReadiness: getRuntimeReadinessMock
}));

vi.mock("@/lib/services/operations/payment-operations", () => ({
  getPaymentOperationsSnapshot: getPaymentOperationsSnapshotMock
}));

describe("/api/dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the seller dashboard snapshot and operational health data", async () => {
    getLiveDashboardSnapshotMock.mockResolvedValue({
      totalIncome: "0.20",
      paidCalls: 1,
      failedDeliveries: 0,
      rejectedAttempts: 1,
      successRate: "100.0",
      avgLatencyMs: 210,
      recentTransactions: [
        {
          transactionHash: "0xabc",
          status: "paid",
          latencyMs: 210
        }
      ],
      recentAttempts: [
        {
          serviceSlug: "token-intel-api",
          status: "rejected",
          invalidReason: "invalid_signature"
        }
      ]
    });
    getRuntimeReadinessMock.mockResolvedValue({
      status: "ready",
      checks: {
        database: {
          status: "pass",
          detail: "Database connectivity check passed."
        }
      }
    });
    getPaymentOperationsSnapshotMock.mockResolvedValue({
      failedDeliveries: 0,
      recoveredDeliveries: 0,
      retryableFailures: 0,
      rejectedProofs: 1,
      latestFailedTransactions: []
    });

    const response = await GET(new Request("http://localhost/api/dashboard"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.snapshot.totalIncome).toBe("0.20");
    expect(payload.readiness.status).toBe("ready");
    expect(payload.operations.rejectedProofs).toBe(1);
    expect(payload.generatedAt).toEqual(expect.any(String));
  });
});
