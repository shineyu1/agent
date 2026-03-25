import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createProviderService } from "@/app/api/providers/services/route";
import { POST as callPayableService } from "@/app/api/services/[slug]/route";
import { createWebSessionToken, SELLEROS_SESSION_COOKIE } from "@/lib/auth/session-bridge";
import { listPaymentAttempts, resetPaymentAttemptStore } from "@/lib/services/gateway/payment-attempt-store";
import { resetServiceStore } from "@/lib/services/registry/service-store";
import { listPaymentEvents, resetPaymentEventStore } from "@/lib/services/gateway/payment-event-store";
import {
  claimPaymentProof,
  listPaymentProofClaims,
  resetPaymentProofClaimStore
} from "@/lib/services/gateway/payment-proof-claim-store";

function encodePaymentHeader(payload: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

const { verifyPaymentProofMock } = vi.hoisted(() => ({
  verifyPaymentProofMock: vi.fn()
}));
const { settlePaymentProofMock } = vi.hoisted(() => ({
  settlePaymentProofMock: vi.fn()
}));

vi.mock("@/lib/services/gateway/payment-verifier", () => ({
  verifyPaymentProof: verifyPaymentProofMock
}));
vi.mock("@/lib/services/gateway/payment-settlement", () => ({
  settlePaymentProof: settlePaymentProofMock
}));

function buildSellerCookie(
  walletAddress = "0xseller111111111111111111111111111111111111",
  providerSlug = "provider_1"
) {
  const session = createWebSessionToken({
    role: "seller",
    walletAddress,
    redirectTo: "/providers",
    providerSlug
  });

  return `${SELLEROS_SESSION_COOKIE}=${encodeURIComponent(session.sessionToken)}`;
}

describe("/api/services/[slug]", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    vi.stubEnv("APP_ENCRYPTION_KEY", "test-app-encryption-key");
    verifyPaymentProofMock.mockReset();
    settlePaymentProofMock.mockReset();
    settlePaymentProofMock.mockResolvedValue({
      ok: false,
      skipped: true
    });
    await resetServiceStore();
    await resetPaymentAttemptStore();
    await resetPaymentEventStore();
    await resetPaymentProofClaimStore();

    const createResponse = await createProviderService(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie(undefined, "provider_1")
        },
        body: JSON.stringify({
          providerId: "provider_1",
          serviceName: "Token Intel API",
          description: "Returns token intelligence snapshots.",
          category: "market-data",
          tags: ["token", "intel"],
          inputSchema: { token: "string" },
          outputSchema: { score: "number" },
          priceAmount: "0.2",
          priceCurrency: "USDT",
          payoutWallet: {
            network: "xlayer",
            address: "0x1111111111111111111111111111111111111111"
          },
          publishing: {
            visibility: "listed"
          },
          source: {
            kind: "manual",
            method: "POST",
            upstreamUrl: "https://provider.example.com/intel"
          },
          access: {
            mode: "hosted",
            authType: "bearer",
            secretCipher: "ciphertext"
          }
        })
      })
    );
    expect(createResponse.status).toBe(201);
  });

  it("returns a payment quote when no payment proof is attached", async () => {
    const response = await callPayableService(
      new Request("http://localhost/api/services/token-intel-api", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ token: "OKB" })
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );

    expect(response.status).toBe(402);
    const rawBody = await response.text();
    const decoded = JSON.parse(Buffer.from(rawBody, "base64").toString("utf8")) as {
      x402Version: number;
      accepts: Array<{
        network: string;
        amount: string;
        maxAmountRequired: string;
        payTo: string;
      }>;
    };
    expect(decoded.x402Version).toBe(1);
    expect(decoded.accepts[0]?.network).toBe("eip155:196");
    expect(decoded.accepts[0]?.amount).toBe("200000");
    expect(decoded.accepts[0]?.maxAmountRequired).toBe("200000");
    expect(decoded.accepts[0]?.payTo).toBe("0x1111111111111111111111111111111111111111");
  });

  it("does not fulfill the request when the provided payment proof is invalid", async () => {
    verifyPaymentProofMock.mockResolvedValue({
      ok: false,
      status: 402,
      invalidReason: "invalid_signature"
    });
    const upstreamFetch = vi.spyOn(globalThis, "fetch");

    const response = await callPayableService(
      new Request("http://localhost/api/services/token-intel-api", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": encodePaymentHeader({
            x402Version: 1,
            accepts: [],
            payload: {}
          })
        },
        body: JSON.stringify({ token: "OKB" })
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );

    expect(response.status).toBe(402);
    const payload = await response.json();
    expect(payload.error).toBe("Payment verification failed");
    expect(payload.invalidReason).toBe("invalid_signature");
    expect(upstreamFetch).not.toHaveBeenCalled();
    expect(await listPaymentEvents()).toHaveLength(0);
    const attempts = await listPaymentAttempts();
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      serviceSlug: "token-intel-api",
      status: "rejected",
      invalidReason: "invalid_signature",
      payerAddress: "unknown-payer",
      verificationSource: "verification_failed",
      quoteVersion: 1
    });
  });

  it("returns a fulfilled payload when payment proof is attached", async () => {
    verifyPaymentProofMock.mockResolvedValue({
      ok: true,
      payer: "0xabc",
      source: "okx-verify"
    });
    settlePaymentProofMock.mockResolvedValue({
      ok: true,
      txHash: "0xrealhash",
      source: "okx-settle"
    });
    const upstreamFetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ score: 81, label: "watch" }), {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        })
      );

    const response = await callPayableService(
      new Request("http://localhost/api/services/token-intel-api", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": encodePaymentHeader({
            x402Version: 1,
            accepts: [],
            payload: {
              signature: "demo-proof",
              authorization: {
                from: "0xabc",
                to: "0x1111111111111111111111111111111111111111",
                value: "200000",
                validAfter: "1716150000",
                validBefore: "1716153600",
                nonce: "0x1234"
              }
            }
          })
        },
        body: JSON.stringify({ token: "OKB" })
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.transactionReference).toBe("0xrealhash");
    expect(payload.result.score).toBe(81);
    expect(upstreamFetch).toHaveBeenCalledTimes(1);
    const upstreamCall = upstreamFetch.mock.calls[0];
    expect(upstreamCall?.[0]).toBe("https://provider.example.com/intel");
    expect(upstreamCall?.[1]?.method).toBe("POST");
    expect((upstreamCall?.[1]?.headers as Headers).get("authorization")).toBe(
      "Bearer ciphertext"
    );

    const events = await listPaymentEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.status).toBe("paid");
    expect(events[0]?.serviceSlug).toBe("token-intel-api");
    expect(events[0]?.payerAddress).toBe("0xabc");
    expect(events[0]?.verificationSource).toBe("okx-verify");
    expect(events[0]?.quoteVersion).toBe(1);
    expect(events[0]?.transactionHash).toBe("0xrealhash");
    expect(events[0]?.proofDigest).toHaveLength(64);
    expect(events[0]?.receipt).toMatchObject({
      verification: {
        payer: "0xabc",
        source: "okx-verify"
      },
      settlement: {
        txHash: "0xrealhash",
        source: "okx-settle",
        settledOnchain: true
      }
    });
  });

  it("rejects replayed payment proofs before verification or settlement", async () => {
    const paymentProof = encodePaymentHeader({
      x402Version: 1,
      accepts: [],
      payload: {
        signature: "demo-proof",
        authorization: {
          from: "0xabc",
          to: "0x1111111111111111111111111111111111111111",
          value: "200000",
          validAfter: "1716150000",
          validBefore: "1716153600",
          nonce: "0x1234"
        }
      }
    });
    verifyPaymentProofMock.mockResolvedValue({
      ok: true,
      payer: "0xabc",
      source: "okx-verify"
    });
    settlePaymentProofMock.mockResolvedValue({
      ok: true,
      txHash: "0xrealhash",
      source: "okx-settle"
    });
    const upstreamFetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ score: 81, label: "watch" }), {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        })
      );

    const firstResponse = await callPayableService(
      new Request("http://localhost/api/services/token-intel-api", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": paymentProof
        },
        body: JSON.stringify({ token: "OKB" })
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );

    expect(firstResponse.status).toBe(200);

    const replayResponse = await callPayableService(
      new Request("http://localhost/api/services/token-intel-api", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": paymentProof
        },
        body: JSON.stringify({ token: "OKB" })
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );

    expect(replayResponse.status).toBe(409);
    const replayPayload = await replayResponse.json();
    expect(replayPayload.error).toBe("Payment proof has already been used");
    expect(replayPayload.invalidReason).toBe("payment_proof_replayed");
    expect(verifyPaymentProofMock).toHaveBeenCalledTimes(1);
    expect(settlePaymentProofMock).toHaveBeenCalledTimes(1);
    expect(upstreamFetch).toHaveBeenCalledTimes(1);

    const attempts = await listPaymentAttempts();
    expect(attempts[0]).toMatchObject({
      serviceSlug: "token-intel-api",
      status: "rejected",
      invalidReason: "payment_proof_replayed",
      payerAddress: "0xabc",
      verificationSource: "replay_guard",
      quoteVersion: 1
    });
  });

  it("rejects proofs that were already claimed in the proof ledger before verification", async () => {
    const paymentProof = JSON.stringify({
      x402Version: 1,
      scheme: "exact",
      payload: {
        signature: "claimed-proof",
        authorization: {
          from: "0xabc",
          to: "0x1111111111111111111111111111111111111111",
          value: "200000",
          validAfter: "1716150000",
          validBefore: "1716153600",
          nonce: "0x5555"
        }
      }
    });

    await claimPaymentProof({
      serviceSlug: "token-intel-api",
      proofDigest: createHash("sha256").update(paymentProof).digest("hex"),
      payerAddress: "0xabc",
      quoteVersion: 1
    });

    const upstreamFetch = vi.spyOn(globalThis, "fetch");

    const response = await callPayableService(
      new Request("http://localhost/api/services/token-intel-api", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": paymentProof
        },
        body: JSON.stringify({ token: "OKB" })
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );

    expect(response.status).toBe(409);
    expect(verifyPaymentProofMock).not.toHaveBeenCalled();
    expect(settlePaymentProofMock).not.toHaveBeenCalled();
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("persists a skipped-settlement receipt when fulfillment succeeds without onchain settlement", async () => {
    verifyPaymentProofMock.mockResolvedValue({
      ok: true,
      payer: "0xabc",
      source: "okx-verify"
    });
    settlePaymentProofMock.mockResolvedValue({
      ok: false,
      skipped: true
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ score: 77 }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      })
    );

    const response = await callPayableService(
      new Request("http://localhost/api/services/token-intel-api", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": JSON.stringify({
            x402Version: 1,
            scheme: "exact",
            payload: {
              signature: "demo-proof",
              authorization: {
                from: "0xabc",
                to: "0x1111111111111111111111111111111111111111",
                value: "200000",
                validAfter: "1716150000",
                validBefore: "1716153600",
                nonce: "0x1234"
              }
            }
          })
        },
        body: JSON.stringify({ token: "OKB" })
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.transactionReference).toContain("tx_token-intel-api");

    const events = await listPaymentEvents();
    expect(events[0]?.receipt).toMatchObject({
      settlement: {
        skipped: true
      }
    });
  });

  it("forwards GET-style service inputs as upstream query parameters", async () => {
    await createProviderService(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie(undefined, "provider_2")
        },
        body: JSON.stringify({
          providerId: "provider_2",
          serviceName: "Token Lookup API",
          description: "Looks up token intelligence by query parameters.",
          category: "market-data",
          tags: ["token", "lookup"],
          inputSchema: { token: "string", chain: "string" },
          outputSchema: { score: "number" },
          priceAmount: "0.1",
          payoutWallet: {
            network: "xlayer",
            address: "0x2222222222222222222222222222222222222222"
          },
          publishing: {
            visibility: "listed"
          },
          source: {
            kind: "manual",
            method: "GET",
            upstreamUrl: "https://provider.example.com/lookup"
          },
          access: {
            mode: "hosted",
            authType: "bearer",
            secretCipher: "query-secret"
          }
        })
      })
    );
    verifyPaymentProofMock.mockResolvedValue({
      ok: true,
      payer: "0xabc",
      source: "okx-verify"
    });
    settlePaymentProofMock.mockResolvedValue({
      ok: false,
      skipped: true
    });
    const upstreamFetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ score: 66 }), {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        })
      );

    const response = await callPayableService(
      new Request("http://localhost/api/services/token-lookup-api", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": JSON.stringify({
            x402Version: 1,
            scheme: "exact",
            payload: {
              signature: "demo-proof",
              authorization: {
                from: "0xabc",
                to: "0x2222222222222222222222222222222222222222",
                value: "100000",
                validAfter: "1716150000",
                validBefore: "1716153600",
                nonce: "0x2234"
              }
            }
          })
        },
        body: JSON.stringify({ token: "OKB", chain: "xlayer" })
      }),
      {
        params: Promise.resolve({ slug: "token-lookup-api" })
      }
    );

    expect(response.status).toBe(200);
    const upstreamCall = upstreamFetch.mock.calls[0];
    expect(String(upstreamCall?.[0])).toBe(
      "https://provider.example.com/lookup?token=OKB&chain=xlayer"
    );
    expect(upstreamCall?.[1]?.method).toBe("GET");
  });

  it("fulfills hosted OpenAPI services by resolving the operation from the spec", async () => {
    await createProviderService(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie(undefined, "provider_openapi")
        },
        body: JSON.stringify({
          providerId: "provider_openapi",
          serviceName: "Wallet Search API",
          description: "Searches wallets by query.",
          category: "search",
          tags: ["wallet", "search"],
          inputSchema: { query: "string" },
          outputSchema: { results: "array" },
          priceAmount: "0.12",
          payoutWallet: {
            network: "xlayer",
            address: "0x3333333333333333333333333333333333333333"
          },
          publishing: {
            visibility: "listed"
          },
          source: {
            kind: "openapi",
            specUrl: "https://provider.example.com/openapi.json",
            operationId: "searchWallets"
          },
          access: {
            mode: "hosted",
            authType: "bearer",
            secretCipher: "openapi-secret"
          }
        })
      })
    );
    verifyPaymentProofMock.mockResolvedValue({
      ok: true,
      payer: "0xabc",
      source: "okx-verify"
    });
    settlePaymentProofMock.mockResolvedValue({
      ok: false,
      skipped: true
    });
    const upstreamFetch = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "https://provider.example.com/openapi.json") {
        return new Response(
          JSON.stringify({
            openapi: "3.0.0",
            servers: [{ url: "https://api.provider.example.com" }],
            paths: {
              "/wallets/search": {
                get: {
                  operationId: "searchWallets"
                }
              }
            }
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        );
      }

      return new Response(JSON.stringify({ results: [{ address: "0xwallet" }] }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      });
    });

    const response = await callPayableService(
      new Request("http://localhost/api/services/wallet-search-api", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": JSON.stringify({
            x402Version: 1,
            scheme: "exact",
            payload: {
              signature: "openapi-proof",
              authorization: {
                from: "0xabc",
                to: "0x3333333333333333333333333333333333333333",
                value: "120000",
                validAfter: "1716150000",
                validBefore: "1716153600",
                nonce: "0x3333"
              }
            }
          })
        },
        body: JSON.stringify({ query: "okx" })
      }),
      {
        params: Promise.resolve({ slug: "wallet-search-api" })
      }
    );

    expect(response.status).toBe(200);
    expect(upstreamFetch).toHaveBeenCalledTimes(2);
    const resolvedCall = upstreamFetch.mock.calls[1];
    expect(String(resolvedCall?.[0])).toBe(
      "https://api.provider.example.com/wallets/search?query=okx"
    );
    expect((resolvedCall?.[1]?.headers as Headers).get("authorization")).toBe(
      "Bearer openapi-secret"
    );
  });

  it("fulfills relay-backed services through the relay endpoint instead of the upstream URL", async () => {
    await createProviderService(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie(undefined, "provider_relay")
        },
        body: JSON.stringify({
          providerId: "provider_relay",
          serviceName: "Relay Intel API",
          description: "Routes paid calls through provider relay.",
          category: "market-data",
          tags: ["relay", "intel"],
          inputSchema: { token: "string" },
          outputSchema: { score: "number" },
          priceAmount: "0.09",
          payoutWallet: {
            network: "xlayer",
            address: "0x4444444444444444444444444444444444444444"
          },
          publishing: {
            visibility: "listed"
          },
          source: {
            kind: "manual",
            method: "POST",
            upstreamUrl: "https://provider.example.com/intel"
          },
          access: {
            mode: "relay",
            relayUrl: "https://relay.example.com/fulfill",
            signingSecret: "relay-signing-secret"
          }
        })
      })
    );
    verifyPaymentProofMock.mockResolvedValue({
      ok: true,
      payer: "0xabc",
      source: "okx-verify"
    });
    settlePaymentProofMock.mockResolvedValue({
      ok: false,
      skipped: true
    });
    const relayFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ score: 88, path: "relay" }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      })
    );

    const response = await callPayableService(
      new Request("http://localhost/api/services/relay-intel-api", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": JSON.stringify({
            x402Version: 1,
            scheme: "exact",
            payload: {
              signature: "relay-proof",
              authorization: {
                from: "0xabc",
                to: "0x4444444444444444444444444444444444444444",
                value: "90000",
                validAfter: "1716150000",
                validBefore: "1716153600",
                nonce: "0x4444"
              }
            }
          })
        },
        body: JSON.stringify({ token: "OKB" })
      }),
      {
        params: Promise.resolve({ slug: "relay-intel-api" })
      }
    );

    expect(response.status).toBe(200);
    expect(relayFetch).toHaveBeenCalledTimes(1);
    const relayCall = relayFetch.mock.calls[0];
    expect(String(relayCall?.[0])).toBe("https://relay.example.com/fulfill");
    expect((relayCall?.[1]?.headers as Headers).get("x-selleros-service-slug")).toBe(
      "relay-intel-api"
    );
    expect((relayCall?.[1]?.headers as Headers).get("x-selleros-signature")).toBeTruthy();
    expect(String(relayCall?.[1]?.body)).toContain("\"upstreamUrl\":\"https://provider.example.com/intel\"");
  });

  it("does not fulfill when onchain settlement fails after verification", async () => {
    verifyPaymentProofMock.mockResolvedValue({
      ok: true,
      payer: "0xabc",
      source: "okx-verify"
    });
    settlePaymentProofMock.mockResolvedValue({
      ok: false,
      status: 502,
      invalidReason: "payment_settlement_failed"
    });
    const upstreamFetch = vi.spyOn(globalThis, "fetch");

    const response = await callPayableService(
      new Request("http://localhost/api/services/token-intel-api", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": JSON.stringify({
            x402Version: 1,
            scheme: "exact",
            payload: {
              signature: "demo-proof",
              authorization: {
                from: "0xabc",
                to: "0x1111111111111111111111111111111111111111",
                value: "200000",
                validAfter: "1716150000",
                validBefore: "1716153600",
                nonce: "0x1234"
              }
            }
          })
        },
        body: JSON.stringify({ token: "OKB" })
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );

    expect(response.status).toBe(502);
    const payload = await response.json();
    expect(payload.error).toBe("Payment settlement failed");
    expect(payload.invalidReason).toBe("payment_settlement_failed");
    expect(upstreamFetch).not.toHaveBeenCalled();

    const events = await listPaymentEvents();
    expect(events[0]).toMatchObject({
      status: "failed_delivery",
      payerAddress: "0xabc",
      verificationSource: "okx-verify",
      receipt: {
        settlement: {
          invalidReason: "payment_settlement_failed",
          settledOnchain: false
        }
      }
    });
  });

  it("records failed delivery metadata when upstream fulfillment returns non-2xx", async () => {
    verifyPaymentProofMock.mockResolvedValue({
      ok: true,
      payer: "0xabc",
      source: "okx-verify"
    });
    settlePaymentProofMock.mockResolvedValue({
      ok: false,
      skipped: true
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "rate limited" }), {
        status: 429,
        headers: {
          "content-type": "application/json"
        }
      })
    );

    const response = await callPayableService(
      new Request("http://localhost/api/services/token-intel-api", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": JSON.stringify({
            x402Version: 1,
            scheme: "exact",
            payload: {
              signature: "demo-proof",
              authorization: {
                from: "0xabc",
                to: "0x1111111111111111111111111111111111111111",
                value: "200000",
                validAfter: "1716150000",
                validBefore: "1716153600",
                nonce: "0x1234"
              }
            }
          })
        },
        body: JSON.stringify({ token: "OKB" })
      }),
      {
        params: Promise.resolve({ slug: "token-intel-api" })
      }
    );

    expect(response.status).toBe(502);
    const payload = await response.json();
    expect(payload.error).toBe("Upstream fulfillment failed");

    const events = await listPaymentEvents();
    expect(events[0]).toMatchObject({
      status: "failed_delivery",
      receipt: {
        upstream: {
          status: 429
        }
      }
    });
  });

  it("rejects non-fulfillable services before settlement is attempted", async () => {
    await createProviderService(
      new Request("http://localhost/api/providers/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: buildSellerCookie(undefined, "provider_demo")
        },
        body: JSON.stringify({
          name: "Aurora Search",
          summary: "Fast semantic search for agent workflows.",
          sourceMode: "openapi",
          source: {
            type: "openapi",
            url: "https://example.com/openapi.json"
          },
          accessMode: "hosted",
          pricing: {
            pricePerCall: 0.05
          },
          payoutWallet: "0x1234567890abcdef1234567890abcdef12345678",
          visibility: "listed"
        })
      })
    );
    verifyPaymentProofMock.mockResolvedValue({
      ok: true,
      payer: "0xabc",
      source: "okx-verify"
    });
    settlePaymentProofMock.mockResolvedValue({
      ok: false,
      skipped: true
    });

    const response = await callPayableService(
      new Request("http://localhost/api/services/aurora-search", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-payment": JSON.stringify({
            x402Version: 1,
            scheme: "exact",
            payload: {
              signature: "demo-proof",
              authorization: {
                from: "0xabc",
                to: "0x1234567890abcdef1234567890abcdef12345678",
                value: "50000",
                validAfter: "1716150000",
                validBefore: "1716153600",
                nonce: "0x1234"
              }
            }
          })
        },
        body: JSON.stringify({ query: "OKX" })
      }),
      {
        params: Promise.resolve({ slug: "aurora-search" })
      }
    );

    expect(response.status).toBe(501);
    const payload = await response.json();
    expect(payload.error).toBe("Service source is not yet wired for direct fulfillment");
    expect(verifyPaymentProofMock).not.toHaveBeenCalled();
    expect(settlePaymentProofMock).not.toHaveBeenCalled();

    const events = await listPaymentEvents();
    const auroraEvent = events.find((event) => event.serviceSlug === "aurora-search");
    expect(auroraEvent).toBeUndefined();
    const claims = await listPaymentProofClaims();
    expect(claims.find((claim) => claim.serviceSlug === "aurora-search")).toBeUndefined();
  });
});
