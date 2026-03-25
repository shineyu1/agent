import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listPaymentAttempts } from "@/lib/services/gateway/payment-attempt-store";
import { listPaymentEvents } from "@/lib/services/gateway/payment-event-store";
import { getServiceBySlug } from "@/lib/services/registry/service-store";

type ServiceDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatTags(tags: string[]) {
  if (tags.length === 0) return "No tags";
  return tags.join(" / ");
}

function formatEventStatus(status: string) {
  if (status === "paid") return "Paid";
  if (status === "failed_delivery") return "Failed delivery";
  return status;
}

function formatVerification(value?: string) {
  if (value === "okx-verify") return "OKX verify";
  if (value === "verification_failed") return "Verification failed";
  return value ?? "Not provided";
}

function getUsageHint(category: string) {
  if (category.toLowerCase().includes("search")) {
    return "Best for research, retrieval, summarization, and live information-gathering agents.";
  }
  if (category.toLowerCase().includes("onchain")) {
    return "Best for wallet screening, contract review, monitoring, and onchain risk workflows.";
  }
  return "Best for workflows that need stable outputs, clear pricing, and durable receipts before handing execution to an agent.";
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) notFound();

  const [events, attempts] = await Promise.all([listPaymentEvents(), listPaymentAttempts()]);

  const serviceEvents = events.filter((event) => event.serviceSlug === slug);
  const serviceAttempts = attempts.filter((attempt) => attempt.serviceSlug === slug);
  const paidEvents = serviceEvents.filter((event) => event.status === "paid");
  const failedEvents = serviceEvents.filter((event) => event.status === "failed_delivery");
  const totalIncome = paidEvents.reduce((sum, event) => sum + event.amount, 0);
  const avgLatencyMs =
    serviceEvents.length === 0
      ? 0
      : Math.round(
          serviceEvents.reduce((sum, event) => sum + event.latencyMs, 0) / serviceEvents.length
        );
  const successRate =
    serviceEvents.length === 0
      ? 0
      : Math.round((paidEvents.length / serviceEvents.length) * 1000) / 10;

  return (
    <main className="home-v2-page-shell">
      <div className="home-v2-page-grid">
        <div className="service-v2-breadcrumbs">
          <Link href="/directory">Directory</Link>
          <span>/</span>
          <Link href="/install">Install</Link>
          <span>/</span>
          <span>{service.slug}</span>
        </div>

        <section className="service-v2-hero">
          <div className="home-v2-section-heading">
            <p className="home-v2-section-eyebrow">Service detail</p>
            <h1 className="home-v2-section-title install-v2-title">{service.name}</h1>
            <p className="home-v2-section-description install-v2-description">
              Evaluate what this service does, what one call costs, how stable recent runs look,
              and whether it deserves a place in the agent workflow.
            </p>
          </div>

          <div className="service-v2-summary-grid">
            <article className="service-v2-summary-card">
              <span>Unit price</span>
              <strong>{service.priceAmount} USD</strong>
            </article>
            <article className="service-v2-summary-card">
              <span>Success rate</span>
              <strong>{successRate.toFixed(1)}%</strong>
            </article>
            <article className="service-v2-summary-card">
              <span>Avg latency</span>
              <strong>{avgLatencyMs} ms</strong>
            </article>
            <article className="service-v2-summary-card">
              <span>Paid calls</span>
              <strong>{paidEvents.length}</strong>
            </article>
          </div>
        </section>

        <section className="service-v2-main-grid">
          <article className="service-v2-main-card">
            <div className="home-v2-section-heading">
              <p className="home-v2-section-eyebrow">Why buy this</p>
              <h2 className="home-v2-section-title install-v2-sidebar-title">
                What this service is good for
              </h2>
              <p className="home-v2-section-description">{service.description}</p>
            </div>

            <p className="home-v2-trust-body">{getUsageHint(service.category)}</p>

            <div className="home-v2-hero-actions">
              <Link href="/install" className="home-v2-primary-link">
                Install Skill
              </Link>
              <Link href="/how-it-works" className="home-v2-secondary-link">
                How it works
              </Link>
            </div>

            <div className="service-v2-flow">
              <h3 className="home-v2-trust-title">x402 call loop</h3>
              <ol className="service-v2-flow-list">
                <li>1. The agent requests the service.</li>
                <li>2. `POST /api/services/{service.slug}` returns a 402 quote.</li>
                <li>3. The Skill pays and retries with proof.</li>
                <li>4. Output and receipt return together.</li>
              </ol>
            </div>

            <pre className="install-v2-code">{`POST /api/services/${service.slug}
Content-Type: application/json
payment-signature: <x402 payment proof>

{ "input": "..." }`}</pre>
          </article>

          <aside className="service-v2-side-card">
            <h2 className="home-v2-trust-title">Service facts</h2>
            <dl className="service-v2-facts">
              <div>
                <dt>Provider</dt>
                <dd>{service.providerName ?? "Unknown provider"}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{service.category}</dd>
              </div>
              <div>
                <dt>Tags</dt>
                <dd>{formatTags(service.tags)}</dd>
              </div>
              <div>
                <dt>Listing</dt>
                <dd>{service.listingState === "LISTED" ? "Listed" : "Unlisted"}</dd>
              </div>
            </dl>

            <div className="service-v2-side-metrics">
              <div className="service-v2-summary-card">
                <span>Total income</span>
                <strong>{totalIncome.toFixed(2)} USD</strong>
              </div>
              <div className="service-v2-summary-card">
                <span>Rejected proofs</span>
                <strong>{serviceAttempts.length}</strong>
              </div>
              <div className="service-v2-summary-card">
                <span>Failed calls</span>
                <strong>{failedEvents.length}</strong>
              </div>
            </div>
          </aside>
        </section>

        <section className="service-v2-logs-grid">
          <article className="service-v2-log-card">
            <h2 className="home-v2-trust-title">Recent payment records</h2>
            {serviceEvents.length === 0 ? (
              <p className="home-v2-trust-body">No paid call or delivery record is available yet.</p>
            ) : (
              <ul className="service-v2-log-list">
                {serviceEvents.slice(0, 3).map((event) => (
                  <li key={event.transactionHash} className="service-v2-log-item">
                    <div className="service-v2-log-topline">
                      <span>{event.transactionHash}</span>
                      <span>{formatEventStatus(event.status)}</span>
                    </div>
                    <div className="service-v2-log-meta">
                      <span>Payer {event.payerAddress ?? "unknown"}</span>
                      <span>Verification {formatVerification(event.verificationSource)}</span>
                      <span>{event.latencyMs} ms</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="service-v2-log-card">
            <h2 className="home-v2-trust-title">Recent rejected attempts</h2>
            {serviceAttempts.length === 0 ? (
              <p className="home-v2-trust-body">No rejected payment proof is recorded for this service.</p>
            ) : (
              <ul className="service-v2-log-list">
                {serviceAttempts.slice(0, 3).map((attempt, index) => (
                  <li
                    key={`${attempt.serviceSlug}-${attempt.proofDigest ?? index}`}
                    className="service-v2-log-item"
                  >
                    <div className="service-v2-log-topline">
                      <span>{attempt.invalidReason}</span>
                      <span>{attempt.status}</span>
                    </div>
                    <div className="service-v2-log-meta">
                      <span>Payer {attempt.payerAddress ?? "unknown"}</span>
                      <span>Verification {formatVerification(attempt.verificationSource)}</span>
                      <span>Quote v{attempt.quoteVersion ?? "?"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
