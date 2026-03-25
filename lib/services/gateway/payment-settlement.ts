import { createHmac } from "node:crypto";
import { getPaymentAssetConfig } from "@/lib/services/gateway/payment-assets";
import { toBaseUnits } from "@/lib/services/gateway/payment-amounts";
import {
  parseX402PaymentHeader,
  toOkxPaymentPayload
} from "@/lib/services/gateway/x402-payload";

type SettlePaymentProofInput = {
  requestUrl: string;
  priceAmount: string;
  priceCurrency?: string;
  payoutAddress: string;
  paymentHeader: string;
};

type SettlePaymentProofResult =
  | {
      ok: true;
      txHash: string;
      source: "okx-settle";
    }
  | {
      ok: false;
      skipped?: true;
      status?: 500 | 502 | 503;
      invalidReason?: string;
    };

type SettlementApiResponse = {
  code?: string;
  msg?: string;
  data?: Array<{
    success?: boolean;
    txHash?: string | null;
    errorReason?: string | null;
  }>;
};

const SETTLE_PATH = "/api/v6/x402/settle";

function getParsedPaymentPayload(paymentHeader: string) {
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

  return paymentPayload;
}

function buildSignedHeaders(body: string) {
  const apiKey = process.env.PAYMENT_API_KEY;
  const apiSecret = process.env.PAYMENT_API_SECRET;
  const apiPassphrase = process.env.PAYMENT_API_PASSPHRASE;

  if (!apiKey || !apiSecret || !apiPassphrase) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const prehash = `${timestamp}POST${SETTLE_PATH}${body}`;
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

export async function settlePaymentProof(
  input: SettlePaymentProofInput
): Promise<SettlePaymentProofResult> {
  if (process.env.PAYMENT_SETTLE_ONCHAIN !== "true") {
    return {
      ok: false,
      skipped: true
    };
  }

  const parsedPaymentPayload = getParsedPaymentPayload(input.paymentHeader);
  if (!parsedPaymentPayload) {
    return {
      ok: false,
      status: 500,
      invalidReason: "invalid_payment_payload"
    };
  }

  const assetConfig = getPaymentAssetConfig(input.priceCurrency);
  const chainIndex = assetConfig.chainIndex;
  const paymentPayload = toOkxPaymentPayload(parsedPaymentPayload, chainIndex);
  if (!paymentPayload) {
    return {
      ok: false,
      status: 500,
      invalidReason: "invalid_payment_payload"
    };
  }
  const requestBody = JSON.stringify({
    x402Version: paymentPayload.x402Version,
    chainIndex,
    syncSettle: true,
    paymentPayload,
    paymentRequirements: {
      scheme: paymentPayload.scheme,
      chainIndex,
      resource: input.requestUrl,
      maxAmountRequired: toBaseUnits(input.priceAmount, assetConfig.decimals),
      payTo: input.payoutAddress,
      asset: assetConfig.assetAddress
    }
  });
  const headers = buildSignedHeaders(requestBody);

  if (!headers) {
    return {
      ok: false,
      status: 503,
      invalidReason: "payment_settlement_not_configured"
    };
  }

  const baseUrl = (process.env.PAYMENT_API_BASE_URL ?? "https://web3.okx.com").replace(
    /\/$/,
    ""
  );

  try {
    const response = await fetch(`${baseUrl}${SETTLE_PATH}`, {
      method: "POST",
      headers,
      body: requestBody
    });

    if (!response.ok) {
      return {
        ok: false,
        status: 502,
        invalidReason: "payment_settlement_failed"
      };
    }

    const payload = (await response.json()) as SettlementApiResponse;
    const settlement = payload.data?.[0];
    if (
      payload.code !== "0" ||
      !settlement ||
      !settlement.success ||
      !settlement.txHash
    ) {
      return {
        ok: false,
        status: 502,
        invalidReason: settlement?.errorReason ?? "payment_settlement_failed"
      };
    }

    return {
      ok: true,
      txHash: settlement.txHash,
      source: "okx-settle"
    };
  } catch {
    return {
      ok: false,
      status: 502,
      invalidReason: "payment_settlement_failed"
    };
  }
}
