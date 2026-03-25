import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/receipts/[txHash]/route";

const { findPaymentEventByTransactionHashMock } = vi.hoisted(() => ({
  findPaymentEventByTransactionHashMock: vi.fn()
}));

vi.mock("@/lib/services/gateway/payment-event-store", () => ({
  findPaymentEventByTransactionHash: findPaymentEventByTransactionHashMock
}));

describe("/api/receipts/[txHash]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the stored receipt for a payment transaction hash", async () => {
    findPaymentEventByTransactionHashMock.mockResolvedValue({
      serviceSlug: "aurora-search",
      amount: 0.05,
      status: "paid",
      latencyMs: 220,
      transactionHash: "0xabc123",
      payerAddress: "0xpayer",
      assetAddress: "0xusdt",
      verificationSource: "okx-verify",
      proofDigest: "proof-digest",
      quoteVersion: 1,
      receipt: {
        settlement: {
          txHash: "0xabc123",
          settledOnchain: true
        }
      }
    });

    const response = await GET(
      new Request("http://localhost/api/receipts/0xabc123"),
      {
        params: Promise.resolve({ txHash: "0xabc123" })
      }
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.receipt).toMatchObject({
      transactionHash: "0xabc123",
      serviceSlug: "aurora-search",
      status: "paid",
      amount: 0.05,
      payerAddress: "0xpayer"
    });
  });

  it("returns 404 when a receipt cannot be found", async () => {
    findPaymentEventByTransactionHashMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/receipts/missing"),
      {
        params: Promise.resolve({ txHash: "missing" })
      }
    );

    expect(response.status).toBe(404);
  });
});
