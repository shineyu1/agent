import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schemaPath = join(process.cwd(), "prisma", "schema.prisma");

describe("SellerOS Prisma schema", () => {
  it("defines the core seller, service, payment, and fulfillment models", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain("model Provider");
    expect(schema).toContain("model Service");
    expect(schema).toContain("model PayoutWallet");
    expect(schema).toContain("model UpstreamCredential");
    expect(schema).toContain("model RelayConfiguration");
    expect(schema).toContain("model PaymentRecord");
    expect(schema).toContain("model FulfillmentRecord");
  });

  it("captures service publishing, pricing, and access mode fields", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain("listingState");
    expect(schema).toContain("priceAmount");
    expect(schema).toContain("credentialMode");
    expect(schema).toContain("transactionHash");
  });
});
