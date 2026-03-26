import { NextResponse } from "next/server";
import { validateSellerActionProof } from "@/lib/auth/agent-session";
import {
  getSensitiveUpdateActions,
  hashProviderActionPayload
} from "@/lib/auth/provider-actions";
import { readSellerSessionFromRequest } from "@/lib/auth/request-session";
import {
  getProviderServiceBySlugForOwner,
  updateProviderServiceBySlugForOwner
} from "@/lib/services/registry/service-store";

type ProviderServiceRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, { params }: ProviderServiceRouteProps) {
  const sessionResult = readSellerSessionFromRequest(request);
  if (!sessionResult.ok) {
    return NextResponse.json({ error: sessionResult.message }, { status: sessionResult.status });
  }

  const { slug } = await params;
  const service = await getProviderServiceBySlugForOwner(
    slug,
    sessionResult.session.walletAddress
  );

  if (!service) {
    return NextResponse.json(
      {
        error: "Service not found"
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    service
  });
}

export async function PATCH(request: Request, { params }: ProviderServiceRouteProps) {
  const sessionResult = readSellerSessionFromRequest(request);
  if (!sessionResult.ok) {
    return NextResponse.json({ error: sessionResult.message }, { status: sessionResult.status });
  }

  const { slug } = await params;
  const payload = await request.json().catch(() => ({}));
  const requiredActions = getSensitiveUpdateActions(payload);
  if (requiredActions.length > 0) {
    const proofResult = validateSellerActionProof({
      proofToken: request.headers.get("x-seller-action-proof"),
      walletAddress: sessionResult.session.walletAddress,
      serviceSlug: slug,
      requiredActions,
      requestHash: hashProviderActionPayload(payload)
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

  const result = await updateProviderServiceBySlugForOwner(
    slug,
    sessionResult.session.walletAddress,
    payload
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.message,
        issues: result.issues
      },
      { status: result.message === "Service not found" ? 404 : 400 }
    );
  }

  return NextResponse.json({
    service: result.service
  });
}
