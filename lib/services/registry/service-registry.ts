import { serviceDefinitionInputSchema, type ServiceDefinitionInput } from "./service-schema";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createServiceDefinition(input: ServiceDefinitionInput) {
  const parsed = serviceDefinitionInputSchema.parse(input);

  const base = {
    providerId: parsed.providerId,
    name: parsed.serviceName,
    slug: slugify(parsed.serviceName),
    description: parsed.description,
    category: parsed.category,
    tags: parsed.tags,
    inputSchema: parsed.inputSchema,
    outputSchema: parsed.outputSchema,
    priceAmount: parsed.priceAmount,
    priceCurrency: parsed.priceCurrency,
    payoutWallet: parsed.payoutWallet,
    listingState: parsed.publishing.visibility === "listed" ? "LISTED" : "UNLISTED",
    credentialMode: parsed.access.mode === "hosted" ? "HOSTED" : "RELAY"
  } as const;

  if (parsed.source.kind === "manual") {
    return {
      ...base,
      sourceKind: "MANUAL",
      httpMethod: parsed.source.method,
      upstreamUrl: parsed.source.upstreamUrl,
      authType: parsed.access.mode === "hosted" ? parsed.access.authType : undefined,
      secretCipher: parsed.access.mode === "hosted" ? parsed.access.secretCipher : undefined,
      relayUrl: parsed.access.mode === "relay" ? parsed.access.relayUrl : undefined,
      signingSecret:
        parsed.access.mode === "relay" ? parsed.access.signingSecret : undefined
    };
  }

  return {
    ...base,
    sourceKind: "OPENAPI",
    specUrl: parsed.source.specUrl,
    operationId: parsed.source.operationId,
    authType: parsed.access.mode === "hosted" ? parsed.access.authType : undefined,
    secretCipher: parsed.access.mode === "hosted" ? parsed.access.secretCipher : undefined,
    relayUrl: parsed.access.mode === "relay" ? parsed.access.relayUrl : undefined,
    signingSecret: parsed.access.mode === "relay" ? parsed.access.signingSecret : undefined
  };
}
