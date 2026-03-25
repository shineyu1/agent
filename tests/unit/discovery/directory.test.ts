import { describe, expect, it } from "vitest";
import { buildDirectory } from "@/lib/services/discovery/directory";

const services = [
  {
    id: "svc_1",
    name: "Token Intel API",
    description: "Structured token intelligence.",
    category: "market-data",
    tags: ["intel"],
    listingState: "LISTED" as const,
    priceAmount: "0.20",
    priceCurrency: "USDT",
    successRate: 0.991,
    avgLatencyMs: 240,
    recentPaidCallCount: 21,
    providerName: "Alpha Data"
  },
  {
    id: "svc_2",
    name: "Wallet Risk API",
    description: "Wallet scoring.",
    category: "risk",
    tags: ["risk"],
    listingState: "LISTED" as const,
    priceAmount: "0.08",
    priceCurrency: "USDT",
    successRate: 0.984,
    avgLatencyMs: 180,
    recentPaidCallCount: 64,
    providerName: "Beta Risk"
  },
  {
    id: "svc_3",
    name: "Private Research API",
    description: "Hidden.",
    category: "research",
    tags: ["private"],
    listingState: "UNLISTED" as const,
    priceAmount: "0.12",
    priceCurrency: "USDT",
    successRate: 0.999,
    avgLatencyMs: 120,
    recentPaidCallCount: 8,
    providerName: "Gamma Labs"
  }
];

describe("buildDirectory", () => {
  it("includes only listed services", () => {
    const directory = buildDirectory(services);

    expect(directory).toHaveLength(2);
    expect(directory.map((service) => service.name)).not.toContain("Private Research API");
  });

  it("sorts by price ascending", () => {
    const directory = buildDirectory(services, { sortBy: "price" });

    expect(directory[0]?.name).toBe("Wallet Risk API");
  });

  it("sorts by latency ascending", () => {
    const directory = buildDirectory(services, { sortBy: "latency" });

    expect(directory[0]?.name).toBe("Wallet Risk API");
  });

  it("sorts by recent paid calls descending", () => {
    const directory = buildDirectory(services, { sortBy: "recentPaidCalls" });

    expect(directory[0]?.name).toBe("Wallet Risk API");
  });
});
