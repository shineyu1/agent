import { createHmac } from "node:crypto";

export type RelayServiceMetadata = {
  slug: string;
  id?: string;
  name?: string;
  [key: string]: unknown;
};

export type RelaySourceMetadata = Record<string, unknown>;

export type RelayPaymentContext = Record<string, unknown>;

export type FulfillRelayRequestInput = {
  relayUrl: string;
  signingSecret: string;
  service: RelayServiceMetadata;
  source: RelaySourceMetadata;
  requestBody: unknown;
  paymentContext: RelayPaymentContext;
};

export type FulfillRelayRequestResult = {
  ok: boolean;
  status: number;
  contentType: string;
  headers: Record<string, string>;
  payload: unknown;
};

function buildRelayBody(input: FulfillRelayRequestInput) {
  return JSON.stringify({
    service: input.service,
    source: input.source,
    requestBody: input.requestBody,
    paymentContext: input.paymentContext
  });
}

function signRelayBody(signingSecret: string, timestamp: string, body: string) {
  return createHmac("sha256", signingSecret)
    .update(`${timestamp}${body}`)
    .digest("base64");
}

async function parseRelayResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json") || contentType.includes("+json")) {
    return {
      contentType,
      payload: await response.json()
    };
  }

  return {
    contentType,
    payload: await response.text()
  };
}

export async function fulfillRelayRequest(
  input: FulfillRelayRequestInput
): Promise<FulfillRelayRequestResult> {
  const timestamp = new Date().toISOString();
  const body = buildRelayBody(input);
  const signature = signRelayBody(input.signingSecret, timestamp, body);

  const headers = new Headers({
    "content-type": "application/json",
    "x-selleros-signature": signature,
    "x-selleros-timestamp": timestamp,
    "x-selleros-service-slug": input.service.slug
  });

  const response = await fetch(input.relayUrl, {
    method: "POST",
    headers,
    body
  });

  const parsed = await parseRelayResponse(response);

  return {
    ok: response.ok,
    status: response.status,
    contentType: parsed.contentType,
    headers: Object.fromEntries(response.headers.entries()),
    payload: parsed.payload
  };
}
