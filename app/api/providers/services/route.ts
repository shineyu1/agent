import { NextResponse } from "next/server";
import { validateSellerActionProof } from "@/lib/auth/agent-session";
import {
  getSensitiveCreateActions,
  hashProviderActionPayload
} from "@/lib/auth/provider-actions";
import { readSellerSessionFromRequest } from "@/lib/auth/request-session";
import {
  createService,
  listProviderServicesByOwnerWallet
} from "@/lib/services/registry/service-store";
import type { ServiceDefinitionInput } from "@/lib/services/registry/service-schema";

type LightweightOnboardingPayload = {
  providerId?: string;
  name: string;
  summary: string;
  sourceMode: "manual" | "openapi";
  source:
    | {
        type: "manual";
        method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        baseUrl: string;
        path: string;
      }
    | {
        type: "openapi";
        url: string;
        operationId?: string;
      };
  accessMode: "hosted" | "relay";
  access?:
    | {
        authType: string;
        secret: string;
      }
    | {
        relayUrl: string;
        signingSecret: string;
      };
  pricing: {
    pricePerCall: number;
    currency?: "USDT" | "USDG";
  };
  payoutWallet: string;
  visibility: "listed" | "unlisted";
};

function sanitizeServiceForApi<T extends Record<string, unknown>>(service: T) {
  const { secretCipher, signingSecret, ...rest } = service;
  return rest;
}

function isLightweightPayload(
  payload: ServiceDefinitionInput | LightweightOnboardingPayload
): payload is LightweightOnboardingPayload {
  return "name" in payload && "summary" in payload && "sourceMode" in payload;
}

function getProviderId(payload: LightweightOnboardingPayload) {
  return typeof payload.providerId === "string" && payload.providerId.trim().length > 0
    ? payload.providerId.trim()
    : "provider_demo";
}

function getHostedAccess(
  payload: LightweightOnboardingPayload,
  fallbackSecret: string
) {
  if (
    payload.access &&
    "authType" in payload.access &&
    typeof payload.access.authType === "string" &&
    typeof payload.access.secret === "string"
  ) {
    return {
      mode: "hosted" as const,
      authType: payload.access.authType,
      secretCipher: payload.access.secret
    };
  }

  return {
    mode: "hosted" as const,
    authType: "bearer",
    secretCipher: fallbackSecret
  };
}

function getRelayAccess(
  payload: LightweightOnboardingPayload,
  fallbackRelayUrl: string,
  fallbackSigningSecret: string
) {
  if (
    payload.access &&
    "relayUrl" in payload.access &&
    typeof payload.access.relayUrl === "string" &&
    typeof payload.access.signingSecret === "string"
  ) {
    return {
      mode: "relay" as const,
      relayUrl: payload.access.relayUrl,
      signingSecret: payload.access.signingSecret
    };
  }

  return {
    mode: "relay" as const,
    relayUrl: fallbackRelayUrl,
    signingSecret: fallbackSigningSecret
  };
}

function normalizePayload(
  payload: ServiceDefinitionInput | LightweightOnboardingPayload
): ServiceDefinitionInput {
  if (!isLightweightPayload(payload)) {
    return payload;
  }

  const providerId = getProviderId(payload);

  if (payload.sourceMode === "openapi") {
    const source =
      payload.source.type === "openapi"
        ? payload.source
        : {
            type: "openapi" as const,
            url: "",
            operationId: ""
          };
    const access =
      payload.accessMode === "hosted"
        ? getHostedAccess(payload, "pending-ui-secret")
        : getRelayAccess(
            payload,
            "https://relay.example.com/pending",
            "pending-relay-secret"
          );

    return {
      providerId,
      serviceName: payload.name,
      description: payload.summary,
      category: "general",
      tags: ["selleros"],
      inputSchema: {},
      outputSchema: {},
      priceAmount: String(payload.pricing.pricePerCall),
      priceCurrency: payload.pricing.currency ?? "USDT",
      payoutWallet: {
        network: "xlayer",
        address: payload.payoutWallet
      },
      publishing: {
        visibility: payload.visibility
      },
      source: {
        kind: "openapi",
        specUrl: source.url,
        operationId:
          source.operationId ??
          `${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-operation`
      },
      access
    };
  }

  const source =
    payload.source.type === "manual"
      ? payload.source
      : {
          type: "manual" as const,
          method: "POST" as const,
          baseUrl: "",
          path: ""
        };
  const access =
    payload.accessMode === "hosted"
      ? getHostedAccess(payload, "pending-ui-secret")
      : getRelayAccess(
          payload,
          "https://relay.example.com/pending",
          "pending-relay-secret"
        );

  return {
    providerId,
    serviceName: payload.name,
    description: payload.summary,
    category: "general",
    tags: ["selleros"],
    inputSchema: {},
    outputSchema: {},
    priceAmount: String(payload.pricing.pricePerCall),
    priceCurrency: payload.pricing.currency ?? "USDT",
    payoutWallet: {
      network: "xlayer",
      address: payload.payoutWallet
    },
    publishing: {
      visibility: payload.visibility
    },
    source: {
      kind: "manual",
      method: source.method ?? "POST",
      upstreamUrl: `${source.baseUrl.replace(/\/$/, "")}${source.path}`
    },
    access
  };
}

export async function GET(request: Request) {
  const sessionResult = readSellerSessionFromRequest(request);
  if (!sessionResult.ok) {
    return NextResponse.json({ error: sessionResult.message }, { status: sessionResult.status });
  }

  const services = await listProviderServicesByOwnerWallet(
    sessionResult.session.walletAddress
  );

  return NextResponse.json({
    services: services.map((service) => sanitizeServiceForApi(service))
  });
}

export async function POST(request: Request) {
  const sessionResult = readSellerSessionFromRequest(request);
  if (!sessionResult.ok) {
    return NextResponse.json({ error: sessionResult.message }, { status: sessionResult.status });
  }

  const rawPayload = (await request.json()) as
    | ServiceDefinitionInput
    | LightweightOnboardingPayload;
  const requiredActions = getSensitiveCreateActions(rawPayload);
  if (requiredActions.length > 0) {
    const proofResult = validateSellerActionProof({
      proofToken: request.headers.get("x-seller-action-proof"),
      walletAddress: sessionResult.session.walletAddress,
      requiredActions,
      requestHash: hashProviderActionPayload(rawPayload)
    });

    if (!proofResult.ok) {
      return NextResponse.json(
        {
          error: proofResult.message,
          requiredActions
        },
        { status: 403 }
      );
    }
  }

  const normalizedPayload = normalizePayload(rawPayload);
  const sessionProviderSlug = sessionResult.session.providerSlug;

  if (
    sessionProviderSlug &&
    normalizedPayload.providerId &&
    normalizedPayload.providerId !== sessionProviderSlug
  ) {
    return NextResponse.json(
      {
        error: "Provider slug does not match the active seller session"
      },
      { status: 409 }
    );
  }

  const result = await createService(
    {
      ...normalizedPayload,
      providerId: sessionProviderSlug ?? normalizedPayload.providerId
    },
    {
      ownerWalletAddress: sessionResult.session.walletAddress
    }
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.message,
        issues: result.issues
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      slug: result.service.slug,
      service: sanitizeServiceForApi(result.service)
    },
    { status: 201 }
  );
}
