import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

function buildExpectedSignature(secret: string, timestamp: string, body: string) {
  return createHmac("sha256", secret).update(`${timestamp}${body}`).digest("base64");
}

describe("fulfillRelayRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("posts a signed relay envelope with SellerOS headers and returns parsed JSON", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-22T10:11:12.000Z"));

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true, relay: "accepted" }), {
        status: 202,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-relay-id": "relay-123"
        }
      })
    );

    const { fulfillRelayRequest } = await import(
      "@/lib/services/gateway/relay-client"
    );

    const requestBody = {
      token: "OKB",
      chain: "xlayer"
    };
    const result = await fulfillRelayRequest({
      relayUrl: "https://relay.example.com/fulfill",
      signingSecret: "relay-secret",
      service: {
        id: "svc_1",
        slug: "token-intel-api",
        name: "Token Intel API"
      },
      source: {
        kind: "manual",
        method: "POST",
        upstreamUrl: "https://provider.example.com/intel"
      },
      requestBody,
      paymentContext: {
        payerAddress: "0xabc",
        quoteVersion: 1
      }
    });

    const timestamp = "2026-03-22T10:11:12.000Z";
    const expectedBody = JSON.stringify({
      service: {
        id: "svc_1",
        slug: "token-intel-api",
        name: "Token Intel API"
      },
      source: {
        kind: "manual",
        method: "POST",
        upstreamUrl: "https://provider.example.com/intel"
      },
      requestBody,
      paymentContext: {
        payerAddress: "0xabc",
        quoteVersion: 1
      }
    });

    expect(result).toEqual({
      ok: true,
      status: 202,
      contentType: "application/json; charset=utf-8",
      headers: {
        "content-type": "application/json; charset=utf-8",
        "x-relay-id": "relay-123"
      },
      payload: {
        ok: true,
        relay: "accepted"
      }
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    expect(url).toBe("https://relay.example.com/fulfill");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Headers).get("content-type")).toBe("application/json");
    expect((init?.headers as Headers).get("x-selleros-timestamp")).toBe(timestamp);
    expect((init?.headers as Headers).get("x-selleros-service-slug")).toBe(
      "token-intel-api"
    );
    expect((init?.headers as Headers).get("x-selleros-signature")).toBe(
      buildExpectedSignature("relay-secret", timestamp, expectedBody)
    );
    expect(String(init?.body)).toBe(expectedBody);
  });

  it("parses a text relay response when the content type is not json", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-22T10:11:12.000Z"));

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("relay-accepted", {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8"
        }
      })
    );

    const { fulfillRelayRequest } = await import(
      "@/lib/services/gateway/relay-client"
    );

    const result = await fulfillRelayRequest({
      relayUrl: "https://relay.example.com/fulfill",
      signingSecret: "relay-secret",
      service: {
        slug: "token-intel-api"
      },
      source: {
        kind: "manual"
      },
      requestBody: { token: "OKB" },
      paymentContext: {
        payerAddress: "0xabc"
      }
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.contentType).toBe("text/plain; charset=utf-8");
    expect(result.payload).toBe("relay-accepted");
  });
});
