import { createHmac } from "node:crypto";
import { getPaymentAssetConfig } from "@/lib/services/gateway/payment-assets";
import { toBaseUnits } from "@/lib/services/gateway/payment-amounts";
import {
  parseX402PaymentHeader,
  toOkxPaymentPayload
} from "@/lib/services/gateway/x402-payload";

type PaymentAuthorization = {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
};

type VerifyPaymentProofInput = {
  requestUrl: string;
  priceAmount: string;
  priceCurrency?: string;
  payoutAddress: string;
  paymentHeader: string;
  description?: string;
  outputSchema?: Record<string, unknown>;
};

type VerifyPaymentProofResult =
  | {
      ok: true;
      payer: string;
      source: "okx-verify" | "bypass";
    }
  | {
      ok: false;
      status: 402 | 500 | 502 | 503;
      invalidReason: string;
    };

type VerifyApiResponse = {
  code?: string;
  msg?: string;
  data?: Array<{
    isValid?: boolean;
    payer?: string | null;
    invalidReason?: string | null;
  }>;
};

const VERIFY_PATH = "/api/v6/x402/verify";

function getPaymentAuthorization(paymentHeader: string) {
  const paymentPayload = parseX402PaymentHeader(paymentHeader);
  const authorization = paymentPayload?.payload?.authorization;

  if (
    !paymentPayload ||
    !authorization ||
    typeof authorization.from !== "string" ||
    typeof authorization.to !== "string" ||
    typeof authorization.value !== "string" ||
    typeof authorization.validAfter !== "string" ||
    typeof authorization.validBefore !== "string" ||
    typeof authorization.nonce !== "string"
  ) {
    return null;
  }

  return {
    paymentPayload,
    authorization: authorization as PaymentAuthorization
  };
}

function buildSignedHeaders(body: string) {
  const apiKey = process.env.PAYMENT_API_KEY;
  const apiSecret = process.env.PAYMENT_API_SECRET;
  const apiPassphrase = process.env.PAYMENT_API_PASSPHRASE;

  if (!apiKey || !apiSecret || !apiPassphrase) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const prehash = `${timestamp}POST${VERIFY_PATH}${body}`;
  const sign = createHmac("sha256", apiSecret).update(prehash).digest("base64");

  const headers = new Headers({
    "content-type": "application/json",
    "OK-ACCESS-KEY": apiKey,
    "OK-ACCESS-SIGN": sign,
    "OK-ACCESS-PASSPHRASE": apiPassphrase,
    "OK-ACCESS-TIMESTAMP": timestamp
  });

  const projectId = process.env.PAYMENT_API_PROJECT_ID;
  if (projectId) {
    headers.set("OK-ACCESS-PROJECT", projectId);
  }

  return headers;
}

function isAuthorizationWindowValid(
  authorization: PaymentAuthorization,
  nowSeconds: number
) {
  const validAfter = Number(authorization.validAfter);
  const validBefore = Number(authorization.validBefore);

  return (
    Number.isFinite(validAfter) &&
    Number.isFinite(validBefore) &&
    validAfter <= nowSeconds &&
    validBefore >= nowSeconds
  );
}

export async function verifyPaymentProof(
  input: VerifyPaymentProofInput
): Promise<VerifyPaymentProofResult> {
  const paymentContext = getPaymentAuthorization(input.paymentHeader);
  if (!paymentContext) {
    return {
      ok: false,
      status: 402,
      invalidReason: "invalid_payment_payload"
    };
  }
  const { paymentPayload, authorization } = paymentContext;

  if (process.env.PAYMENT_VERIFY_BYPASS === "true") {
    const assetConfig = getPaymentAssetConfig(input.priceCurrency);
    const expectedAmount = toBaseUnits(input.priceAmount, assetConfig.decimals);

    if (authorization.to.toLowerCase() !== input.payoutAddress.toLowerCase()) {
      return {
        ok: false,
        status: 402,
        invalidReason: "payment_bypass_payout_mismatch"
      };
    }

    if (authorization.value !== expectedAmount) {
      return {
        ok: false,
        status: 402,
        invalidReason: "payment_bypass_amount_mismatch"
      };
    }

    if (
      !isAuthorizationWindowValid(
        authorization,
        Math.floor(Date.now() / 1000)
      )
    ) {
      return {
        ok: false,
        status: 402,
        invalidReason: "payment_bypass_window_invalid"
      };
    }

    return {
      ok: true,
      payer: authorization.from,
      source: "bypass"
    };
  }

  const assetConfig = getPaymentAssetConfig(input.priceCurrency);
  const chainIndex = assetConfig.chainIndex;
  const okxPaymentPayload = toOkxPaymentPayload(paymentPayload, chainIndex);
  if (!okxPaymentPayload) {
    return {
      ok: false,
      status: 402,
      invalidReason: "invalid_payment_payload"
    };
  }
  const paymentRequirements = {
    scheme: okxPaymentPayload.scheme,
    chainIndex,
    resource: input.requestUrl,
    description: input.description ?? "SellerOS protected API access",
    mimeType: "application/json",
    maxAmountRequired: toBaseUnits(input.priceAmount, assetConfig.decimals),
    maxTimeoutSeconds: 60,
    payTo: input.payoutAddress,
    asset: assetConfig.assetAddress,
    outputSchema: input.outputSchema
  };
  const requestBody = JSON.stringify({
    x402Version: okxPaymentPayload.x402Version,
    chainIndex,
    paymentPayload: okxPaymentPayload,
    paymentRequirements
  });
  const headers = buildSignedHeaders(requestBody);

  if (!headers) {
    return {
      ok: false,
      status: 503,
      invalidReason: "payment_verifier_not_configured"
    };
  }

  const baseUrl = (process.env.PAYMENT_API_BASE_URL ?? "https://web3.okx.com").replace(
    /\/$/,
    ""
  );

  try {
    const response = await fetch(`${baseUrl}${VERIFY_PATH}`, {
      method: "POST",
      headers,
      body: requestBody
    });

    if (!response.ok) {
      return {
        ok: false,
        status: 502,
        invalidReason: "payment_verifier_unavailable"
      };
    }

    const payload = (await response.json()) as VerifyApiResponse;
    const verification = payload.data?.[0];

    if (payload.code !== "0" || !verification) {
      return {
        ok: false,
        status: 502,
        invalidReason: "payment_verifier_unavailable"
      };
    }

    if (!verification.isValid) {
      return {
        ok: false,
        status: 402,
        invalidReason: verification.invalidReason ?? "invalid_payment"
      };
    }

    return {
      ok: true,
      payer: verification.payer ?? authorization.from,
      source: "okx-verify"
    };
  } catch {
    return {
      ok: false,
      status: 502,
      invalidReason: "payment_verifier_unavailable"
    };
  }
}
