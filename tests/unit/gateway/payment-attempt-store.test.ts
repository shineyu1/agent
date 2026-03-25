import { beforeEach, describe, expect, it, vi } from "vitest";

const { fsMock, dbMock } = vi.hoisted(() => {
  const fsMock = {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(() => "[]"),
    writeFileSync: vi.fn()
  };

  const dbMock = {
    paymentAttempt: {
      create: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn()
    },
    service: {
      findUnique: vi.fn()
    }
  };

  return { fsMock, dbMock };
});

vi.mock("node:fs", () => fsMock);
vi.mock("@/lib/db/client", () => ({ db: dbMock }));

describe("payment-attempt-store", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("persists rejected payment attempts into Prisma", async () => {
    dbMock.service.findUnique.mockResolvedValue({
      id: "svc_1"
    });
    dbMock.paymentAttempt.create.mockResolvedValue({
      id: "attempt_1"
    });

    const { recordPaymentAttempt } = await import(
      "@/lib/services/gateway/payment-attempt-store"
    );

    await recordPaymentAttempt({
      serviceSlug: "token-intel-api",
      status: "rejected",
      invalidReason: "invalid_signature",
      payerAddress: "0xabc",
      verificationSource: "okx-verify",
      proofDigest: "proof-sha256",
      quoteVersion: 1,
      receipt: {
        verification: {
          payer: "0xabc",
          invalidReason: "invalid_signature"
        }
      }
    });

    expect(dbMock.paymentAttempt.create).toHaveBeenCalledTimes(1);
    expect(dbMock.paymentAttempt.create.mock.calls[0]?.[0]).toMatchObject({
      data: {
        serviceId: "svc_1",
        status: "rejected",
        invalidReason: "invalid_signature",
        payerAddress: "0xabc",
        verificationSource: "okx-verify",
        proofDigest: "proof-sha256",
        quoteVersion: 1,
        receiptJson: {
          verification: {
            payer: "0xabc",
            invalidReason: "invalid_signature"
          }
        }
      }
    });
    expect(fsMock.writeFileSync).toHaveBeenCalledTimes(1);
  });

  it("does not silently fall back on non-availability Prisma errors", async () => {
    dbMock.service.findUnique.mockResolvedValue({
      id: "svc_1"
    });
    dbMock.paymentAttempt.create.mockRejectedValue(new Error("boom"));

    const { recordPaymentAttempt } = await import(
      "@/lib/services/gateway/payment-attempt-store"
    );

    await expect(
      recordPaymentAttempt({
        serviceSlug: "token-intel-api",
        status: "rejected",
        invalidReason: "invalid_signature"
      })
    ).rejects.toThrow("boom");
  });
});
