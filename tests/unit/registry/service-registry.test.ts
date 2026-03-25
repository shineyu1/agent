import { describe, expect, it } from "vitest";
import { createServiceDefinition } from "@/lib/services/registry/service-registry";

describe("createServiceDefinition", () => {
  it("normalizes a listed manual service definition", () => {
    const service = createServiceDefinition({
      providerId: "provider_1",
      serviceName: "Token Intel API",
      description: "Returns token intelligence snapshots.",
      category: "market-data",
      tags: ["token", "intel"],
      inputSchema: {
        token: "string"
      },
      outputSchema: {
        score: "number"
      },
      priceAmount: "0.2",
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
    });

    expect(service.slug).toBe("token-intel-api");
    expect(service.listingState).toBe("LISTED");
    expect(service.credentialMode).toBe("HOSTED");
    expect(service.httpMethod).toBe("POST");
  });

  it("rejects invalid pricing", () => {
    expect(() =>
      createServiceDefinition({
        providerId: "provider_1",
        serviceName: "Broken Price API",
        description: "Bad price example.",
        category: "market-data",
        tags: [],
        inputSchema: {},
        outputSchema: {},
        priceAmount: "-1",
        payoutWallet: {
          network: "xlayer",
          address: "0x1111111111111111111111111111111111111111"
        },
        publishing: {
          visibility: "unlisted"
        },
        source: {
          kind: "manual",
          method: "GET",
          upstreamUrl: "https://provider.example.com/bad"
        },
        access: {
          mode: "hosted",
          authType: "bearer",
          secretCipher: "ciphertext"
        }
      })
    ).toThrow("Price must be zero or greater");
  });

  it("supports unlisted OpenAPI-backed services", () => {
    const service = createServiceDefinition({
      providerId: "provider_1",
      serviceName: "Wallet Risk API",
      description: "Scores wallet risk.",
      category: "risk",
      tags: ["wallet"],
      inputSchema: {
        address: "string"
      },
      outputSchema: {
        risk: "number"
      },
      priceAmount: "0.08",
      payoutWallet: {
        network: "xlayer",
        address: "0x1111111111111111111111111111111111111111"
      },
      publishing: {
        visibility: "unlisted"
      },
      source: {
        kind: "openapi",
        specUrl: "https://provider.example.com/openapi.json",
        operationId: "scoreWallet"
      },
      access: {
        mode: "relay",
        relayUrl: "https://relay.example.com/wallet-risk",
        signingSecret: "relay-secret"
      }
    });

    expect(service.listingState).toBe("UNLISTED");
    expect(service.credentialMode).toBe("RELAY");
    expect(service.operationId).toBe("scoreWallet");
  });

  it("requires access-mode-specific fields", () => {
    expect(() =>
      createServiceDefinition({
        providerId: "provider_1",
        serviceName: "Missing Relay Secret",
        description: "Relay validation check.",
        category: "risk",
        tags: [],
        inputSchema: {},
        outputSchema: {},
        priceAmount: "0.08",
        payoutWallet: {
          network: "xlayer",
          address: "0x1111111111111111111111111111111111111111"
        },
        publishing: {
          visibility: "listed"
        },
        source: {
          kind: "manual",
          method: "GET",
          upstreamUrl: "https://provider.example.com/risk"
        },
        access: {
          mode: "relay",
          relayUrl: "https://relay.example.com/risk"
        }
      })
    ).toThrow("signingSecret");
  });
});
