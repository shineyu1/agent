import { resolveOpenApiOperationRequest } from "@/lib/services/gateway/openapi-client";
import { fulfillRelayRequest } from "@/lib/services/gateway/relay-client";

export type StoredServiceLike = {
  id: string;
  slug: string;
  name: string;
  credentialMode: "HOSTED" | "RELAY";
  sourceKind: "MANUAL" | "OPENAPI";
  authType?: string;
  secretCipher?: string;
  upstreamUrl?: string;
  httpMethod?: string;
  specUrl?: string;
  operationId?: string;
  relayUrl?: string;
  signingSecret?: string;
};

export type FulfillmentResult = {
  status: number;
  payload: unknown;
};

function buildUpstreamUrl(upstreamUrl: string, method: string, body: unknown) {
  if (method !== "GET") {
    return upstreamUrl;
  }

  const url = new URL(upstreamUrl);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return url.toString();
  }

  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          url.searchParams.append(key, String(item));
        }
      }
      continue;
    }

    if (typeof value === "object") {
      url.searchParams.set(key, JSON.stringify(value));
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

function isHostedManualFulfillableService(
  service: StoredServiceLike
): service is StoredServiceLike & {
  sourceKind: "MANUAL";
  credentialMode: "HOSTED";
  upstreamUrl: string;
  httpMethod: string;
} {
  return (
    service.credentialMode === "HOSTED" &&
    service.secretCipher !== "pending-ui-secret" &&
    service.sourceKind === "MANUAL" &&
    typeof service.upstreamUrl === "string" &&
    service.upstreamUrl.length > 0 &&
    typeof service.httpMethod === "string" &&
    service.httpMethod.length > 0
  );
}

function isHostedOpenApiFulfillableService(
  service: StoredServiceLike
): service is StoredServiceLike & {
  sourceKind: "OPENAPI";
  credentialMode: "HOSTED";
  specUrl: string;
  operationId: string;
} {
  return (
    service.credentialMode === "HOSTED" &&
    service.secretCipher !== "pending-ui-secret" &&
    service.sourceKind === "OPENAPI" &&
    typeof service.specUrl === "string" &&
    service.specUrl.length > 0 &&
    typeof service.operationId === "string" &&
    service.operationId.length > 0
  );
}

function isRelayFulfillableService(
  service: StoredServiceLike
): service is StoredServiceLike & {
  credentialMode: "RELAY";
  relayUrl: string;
  signingSecret: string;
} {
  return (
    service.credentialMode === "RELAY" &&
    service.relayUrl !== "https://relay.example.com/pending" &&
    service.signingSecret !== "pending-relay-secret" &&
    typeof service.relayUrl === "string" &&
    service.relayUrl.length > 0 &&
    typeof service.signingSecret === "string" &&
    service.signingSecret.length > 0
  );
}

function buildHostedBearerToken(service: StoredServiceLike) {
  return service.authType === "bearer" && service.secretCipher
    ? service.secretCipher
    : undefined;
}

function buildRelaySourceMetadata(service: StoredServiceLike) {
  if (service.sourceKind === "MANUAL") {
    return {
      kind: "manual",
      method: service.httpMethod,
      upstreamUrl: service.upstreamUrl
    };
  }

  return {
    kind: "openapi",
    specUrl: service.specUrl,
    operationId: service.operationId
  };
}

async function fulfillManualHostedService(
  service: StoredServiceLike & {
    sourceKind: "MANUAL";
    credentialMode: "HOSTED";
    upstreamUrl: string;
    httpMethod: string;
  },
  body: unknown
): Promise<FulfillmentResult> {
  const upstreamHeaders = new Headers({
    "content-type": "application/json"
  });
  const bearerToken = buildHostedBearerToken(service);

  if (bearerToken) {
    upstreamHeaders.set("authorization", `Bearer ${bearerToken}`);
  }

  const upstreamUrl = buildUpstreamUrl(service.upstreamUrl, service.httpMethod, body);
  const upstreamResponse = await fetch(upstreamUrl, {
    method: service.httpMethod,
    headers: upstreamHeaders,
    body: service.httpMethod === "GET" ? undefined : JSON.stringify(body)
  });
  const contentType = upstreamResponse.headers.get("content-type") ?? "";

  return {
    status: upstreamResponse.status,
    payload: contentType.includes("application/json")
      ? await upstreamResponse.json()
      : await upstreamResponse.text()
  };
}

async function fulfillOpenApiHostedService(
  service: StoredServiceLike & {
    sourceKind: "OPENAPI";
    credentialMode: "HOSTED";
    specUrl: string;
    operationId: string;
  },
  body: unknown
): Promise<FulfillmentResult> {
  const response = await resolveOpenApiOperationRequest({
    specUrl: service.specUrl,
    operationId: service.operationId,
    body,
    bearerToken: buildHostedBearerToken(service)
  });

  return {
    status: response.status,
    payload: response.payload
  };
}

async function fulfillRelayBackedService(
  service: StoredServiceLike & {
    credentialMode: "RELAY";
    relayUrl: string;
    signingSecret: string;
  },
  body: unknown,
  paymentContext: Record<string, unknown>
): Promise<FulfillmentResult> {
  const response = await fulfillRelayRequest({
    relayUrl: service.relayUrl,
    signingSecret: service.signingSecret,
    service: {
      id: service.id,
      slug: service.slug,
      name: service.name
    },
    source: buildRelaySourceMetadata(service),
    requestBody: body,
    paymentContext
  });

  return {
    status: response.status,
    payload: response.payload
  };
}

export function isServiceFulfillable(service: StoredServiceLike) {
  return (
    isRelayFulfillableService(service) ||
    isHostedManualFulfillableService(service) ||
    isHostedOpenApiFulfillableService(service)
  );
}

export async function fulfillServiceRequest(
  service: StoredServiceLike,
  body: unknown,
  paymentContext: Record<string, unknown>
): Promise<FulfillmentResult> {
  if (isRelayFulfillableService(service)) {
    return fulfillRelayBackedService(service, body, paymentContext);
  }

  if (isHostedManualFulfillableService(service)) {
    return fulfillManualHostedService(service, body);
  }

  if (isHostedOpenApiFulfillableService(service)) {
    return fulfillOpenApiHostedService(service, body);
  }

  throw new Error("SERVICE_NOT_FULFILLABLE");
}
