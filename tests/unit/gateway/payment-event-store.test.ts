import { beforeEach, describe, expect, it, vi } from "vitest";

const { fsMock, dbMock } = vi.hoisted(() => {
  const fsMock = {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(() =>
      JSON.stringify([
        {
          serviceSlug: "fallback-service",
          amount: 0.08,
          status: "failed_delivery",
          latencyMs: 900,
          transactionHash: "0xfallback"
        }
      ])
    ),
    writeFileSync: vi.fn()
  };

  const dbMock = {
    paymentRecord: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    service: {
      findUnique: vi.fn()
    },
    fulfillmentRecord: {
      create: vi.fn(),
      update: vi.fn()
    },
    $transaction: vi.fn()
  };

  return { fsMock, dbMock };
});

vi.mock("node:fs", () => fsMock);
vi.mock("@/lib/db/client", () => ({ db: dbMock }));

describe("payment-event-store", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("merges prisma events with fallback file events instead of hiding fallback writes", async () => {
    dbMock.paymentRecord.findMany.mockResolvedValue([
      {
        amount: { toString: () => "0.2", valueOf: () => 0.2 },
        status: "paid",
        transactionHash: "0xprisma",
        payerAddress: "0xabc",
        assetAddress: "0xusdt",
        verificationSource: "okx-verify",
        proofDigest: "proof-sha256",
        quoteVersion: 1,
        service: {
          slug: "token-intel-api"
        },
        fulfillment: {
          latencyMs: 240,
          receiptJson: {
            verification: {
              payer: "0xabc"
            }
          }
        }
      }
    ]);

    const { listPaymentEvents } = await import(
      "@/lib/services/gateway/payment-event-store"
    );
    const events = await listPaymentEvents();

    expect(events.map((event) => event.transactionHash)).toEqual([
      "0xprisma",
      "0xfallback"
    ]);
    expect(events[0]).toMatchObject({
      payerAddress: "0xabc",
      assetAddress: "0xusdt",
      verificationSource: "okx-verify",
      proofDigest: "proof-sha256",
      quoteVersion: 1,
      receipt: {
        verification: {
          payer: "0xabc"
        }
      }
    });
  });

  it("persists payment verification and receipt metadata into Prisma when available", async () => {
    dbMock.service.findUnique.mockResolvedValue({
      id: "svc_1"
    });
    dbMock.paymentRecord.create.mockResolvedValue({
      id: "pay_1"
    });
    dbMock.fulfillmentRecord.create.mockResolvedValue({
      id: "ful_1"
    });
    dbMock.$transaction.mockImplementation(async (callback) =>
      callback({
        paymentRecord: dbMock.paymentRecord,
        fulfillmentRecord: dbMock.fulfillmentRecord
      })
    );

    const { recordPaymentEvent } = await import(
      "@/lib/services/gateway/payment-event-store"
    );

    await recordPaymentEvent({
      serviceSlug: "token-intel-api",
      amount: 0.2,
      status: "paid",
      latencyMs: 240,
      transactionHash: "0xrealhash",
      payerAddress: "0xabc",
      assetAddress: "0xusdt",
      verificationSource: "okx-verify",
      proofDigest: "proof-sha256",
      quoteVersion: 1,
      receipt: {
        verification: {
          payer: "0xabc",
          source: "okx-verify"
        },
        settlement: {
          txHash: "0xrealhash",
          settledOnchain: true
        }
      }
    });

    expect(dbMock.paymentRecord.create).toHaveBeenCalledTimes(1);
    expect(dbMock.paymentRecord.create.mock.calls[0]?.[0]).toMatchObject({
      data: {
        serviceId: "svc_1",
        amount: 0.2,
        status: "paid",
        transactionHash: "0xrealhash",
        payerAddress: "0xabc",
        assetAddress: "0xusdt",
        verificationSource: "okx-verify",
        proofDigest: "proof-sha256",
        quoteVersion: 1
      }
    });
    expect(dbMock.fulfillmentRecord.create).toHaveBeenCalledTimes(1);
    expect(dbMock.fulfillmentRecord.create.mock.calls[0]?.[0]).toMatchObject({
      data: {
        serviceId: "svc_1",
        paymentRecordId: "pay_1",
        status: "SUCCEEDED",
        latencyMs: 240,
        responseCode: 200,
        receiptJson: {
          verification: {
            payer: "0xabc",
            source: "okx-verify"
          },
          settlement: {
            txHash: "0xrealhash",
            settledOnchain: true
          }
        }
      }
    });
    expect(fsMock.writeFileSync).toHaveBeenCalledTimes(1);
  });

  it("does not silently fall back to file reads on non-availability Prisma errors", async () => {
    dbMock.paymentRecord.findMany.mockRejectedValue(new Error("boom"));

    const { listPaymentEvents } = await import(
      "@/lib/services/gateway/payment-event-store"
    );

    await expect(listPaymentEvents()).rejects.toThrow("boom");
  });

  it("updates an existing payment event in Prisma and fallback storage without duplicating it", async () => {
    dbMock.paymentRecord.findUnique.mockResolvedValue({
      id: "pay_1",
      transactionHash: "0xrealhash",
      service: {
        slug: "token-intel-api"
      },
      fulfillment: {
        id: "ful_1"
      }
    });
    dbMock.paymentRecord.update.mockResolvedValue({});
    dbMock.fulfillmentRecord.update.mockResolvedValue({});

    const { updatePaymentEvent } = await import(
      "@/lib/services/gateway/payment-event-store"
    );

    await updatePaymentEvent("0xrealhash", {
      status: "paid",
      latencyMs: 180,
      receipt: {
        settlement: {
          skipped: true
        },
        upstream: {
          status: 200
        },
        reconciliation: {
          retried: true
        }
      }
    });

    expect(dbMock.paymentRecord.update).toHaveBeenCalledWith({
      where: {
        transactionHash: "0xrealhash"
      },
      data: {
        status: "paid"
      }
    });
    expect(dbMock.fulfillmentRecord.update).toHaveBeenCalledWith({
      where: {
        paymentRecordId: "pay_1"
      },
      data: {
        status: "SUCCEEDED",
        latencyMs: 180,
        responseCode: 200,
        receiptJson: {
          settlement: {
            skipped: true
          },
          upstream: {
            status: 200
          },
          reconciliation: {
            retried: true
          }
        }
      }
    });
    expect(fsMock.writeFileSync).toHaveBeenCalled();
  });
});
