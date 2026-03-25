import { NextResponse } from "next/server";
import { buildServiceDetailPayload } from "@/lib/services/api/service-detail";
import { listPaymentAttempts } from "@/lib/services/gateway/payment-attempt-store";
import { listPaymentEvents } from "@/lib/services/gateway/payment-event-store";
import { getServiceBySlug } from "@/lib/services/registry/service-store";

type DetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, { params }: DetailRouteProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const [events, attempts] = await Promise.all([
    listPaymentEvents(),
    listPaymentAttempts()
  ]);

  const serviceEvents = events.filter((event) => event.serviceSlug === slug);
  const serviceAttempts = attempts.filter((attempt) => attempt.serviceSlug === slug);
  const paidEvents = serviceEvents.filter((event) => event.status === "paid");
  const failedEvents = serviceEvents.filter((event) => event.status === "failed_delivery");
  const averageLatencyMs =
    serviceEvents.length === 0
      ? 0
      : Math.round(
          serviceEvents.reduce((sum, event) => sum + event.latencyMs, 0) /
            serviceEvents.length
        );

  return NextResponse.json(
    buildServiceDetailPayload(service, {
      paidCallCount: paidEvents.length,
      failedDeliveryCount: failedEvents.length,
      rejectedProofCount: serviceAttempts.length,
      averageLatencyMs
    })
  );
}
