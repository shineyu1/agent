import { z } from "zod";

const payoutWalletSchema = z.object({
  network: z.string().min(1, "Wallet network is required"),
  address: z.string().min(1, "Wallet address is required")
});

const publishingSchema = z.object({
  visibility: z.enum(["listed", "unlisted"])
});

const priceCurrencySchema = z.enum(["USDT", "USDG"]);

const manualSourceSchema = z.object({
  kind: z.literal("manual"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  upstreamUrl: z.string().url("Manual services require a valid upstream URL")
});

const openApiSourceSchema = z.object({
  kind: z.literal("openapi"),
  specUrl: z.string().url("OpenAPI import requires a valid spec URL"),
  operationId: z.string().min(1, "OpenAPI services require an operationId")
});

const hostedAccessSchema = z.object({
  mode: z.literal("hosted"),
  authType: z.string().min(1, "Hosted mode requires an auth type"),
  secretCipher: z.string().min(1, "Hosted mode requires an encrypted secret")
});

const relayAccessSchema = z.object({
  mode: z.literal("relay"),
  relayUrl: z.string().url("Relay mode requires a valid relay URL"),
  signingSecret: z.string().min(1, "Relay mode requires a signingSecret")
});

export const serviceDefinitionInputSchema = z.object({
  providerId: z.string().min(1, "Provider is required"),
  serviceName: z.string().min(1, "Service name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).default([]),
  inputSchema: z.record(z.string(), z.string()).or(z.record(z.string(), z.number())).or(z.record(z.string(), z.any())),
  outputSchema: z.record(z.string(), z.string()).or(z.record(z.string(), z.number())).or(z.record(z.string(), z.any())),
  priceAmount: z
    .string()
    .refine((value) => !Number.isNaN(Number(value)), "Price must be numeric")
    .refine((value) => Number(value) >= 0, "Price must be zero or greater"),
  priceCurrency: priceCurrencySchema.default("USDT"),
  payoutWallet: payoutWalletSchema,
  publishing: publishingSchema,
  source: z.discriminatedUnion("kind", [manualSourceSchema, openApiSourceSchema]),
  access: z.discriminatedUnion("mode", [hostedAccessSchema, relayAccessSchema])
});

export type ServiceDefinitionInput = z.infer<typeof serviceDefinitionInputSchema>;
