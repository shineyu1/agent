import { getPaymentAssetConfig } from "@/lib/services/gateway/payment-assets";
import { toBaseUnits } from "@/lib/services/gateway/payment-amounts";

type PaymentAuthorization = {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
};

export type X402PaymentPayload = {
  x402Version: number | string;
  scheme?: string;
  network?: string;
  chainIndex?: string;
  accepts?: Array<Record<string, unknown>>;
  payload?: {
    signature: string;
    authorization: PaymentAuthorization;
  };
  [key: string]: unknown;
};

type CreateX402PayloadInput = {
  requestUrl: string;
  serviceId: string;
  serviceSlug: string;
  description?: string;
  priceAmount: string;
  priceCurrency?: string;
  payoutAddress: string;
  outputSchema?: Record<string, unknown>;
};

export function createX402PaymentPayload(input: CreateX402PayloadInput) {
  const assetConfig = getPaymentAssetConfig(input.priceCurrency);
  const amount = toBaseUnits(input.priceAmount, assetConfig.decimals);

  return {
    x402Version: 1,
    error: "X402_PAYMENT_REQUIRED",
    accepts: [
      {
        scheme: "exact",
        network: assetConfig.network,
        amount,
        maxAmountRequired: amount,
        maxTimeoutSeconds: 300,
        resource: input.requestUrl,
        description: input.description ?? `${input.serviceSlug} paid access`,
        mimeType: "application/json",
        payTo: input.payoutAddress,
        asset: assetConfig.assetAddress,
        outputSchema: input.outputSchema,
        extra: {
          serviceId: input.serviceId,
          serviceSlug: input.serviceSlug,
          currency: assetConfig.symbol
        }
      }
    ]
  };
}

export function encodeX402PaymentPayload(payload: X402PaymentPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function parseX402PaymentHeader(paymentHeader: string): X402PaymentPayload | null {
  const candidates = [paymentHeader];

  try {
    candidates.push(Buffer.from(paymentHeader, "base64").toString("utf8"));
  } catch {
    // Ignore invalid base64 and fall back to raw JSON parsing.
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as X402PaymentPayload;
      if (!parsed || typeof parsed !== "object") {
        continue;
      }

      if (
        parsed.payload &&
        typeof parsed.payload === "object" &&
        typeof parsed.payload.signature === "string" &&
        parsed.payload.authorization &&
        typeof parsed.payload.authorization === "object" &&
        typeof parsed.payload.authorization.from === "string" &&
        typeof parsed.payload.authorization.to === "string" &&
        typeof parsed.payload.authorization.value === "string" &&
        typeof parsed.payload.authorization.validAfter === "string" &&
        typeof parsed.payload.authorization.validBefore === "string" &&
        typeof parsed.payload.authorization.nonce === "string"
      ) {
        return parsed;
      }
    } catch {
      // Try next candidate.
    }
  }

  return null;
}

type OkxPaymentPayload = {
  x402Version: number;
  scheme: string;
  chainIndex: string;
  payload: {
    signature: string;
    authorization: PaymentAuthorization;
  };
};

function getFirstAccept(payload: X402PaymentPayload) {
  const accept = payload.accepts?.[0];
  if (!accept || typeof accept !== "object") {
    return null;
  }

  return accept as Record<string, unknown>;
}

function parseChainIndexFromNetwork(network: string | undefined) {
  if (!network) {
    return null;
  }

  const [, chainIndex] = network.split(":");
  return chainIndex && /^\d+$/.test(chainIndex) ? chainIndex : null;
}

export function toOkxPaymentPayload(
  payload: X402PaymentPayload,
  fallbackChainIndex: string
): OkxPaymentPayload | null {
  if (!payload.payload?.signature || !payload.payload.authorization) {
    return null;
  }

  const firstAccept = getFirstAccept(payload);
  const scheme =
    typeof payload.scheme === "string"
      ? payload.scheme
      : typeof firstAccept?.scheme === "string"
        ? firstAccept.scheme
        : "exact";
  const chainIndex =
    typeof payload.chainIndex === "string" && payload.chainIndex.length > 0
      ? payload.chainIndex
      : parseChainIndexFromNetwork(
          typeof payload.network === "string"
            ? payload.network
            : typeof firstAccept?.network === "string"
              ? firstAccept.network
              : undefined
        ) ?? fallbackChainIndex;

  return {
    x402Version: Number(payload.x402Version ?? 1),
    scheme,
    chainIndex,
    payload: payload.payload
  };
}
