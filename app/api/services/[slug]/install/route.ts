import { NextResponse } from "next/server";
import { buildServiceInstallPayload } from "@/lib/services/api/service-detail";
import { getServiceBySlug } from "@/lib/services/registry/service-store";

type InstallRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, { params }: InstallRouteProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json(buildServiceInstallPayload(service));
}
