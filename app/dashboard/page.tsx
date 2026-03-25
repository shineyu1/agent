import React from "react";
import { getLiveDashboardSnapshot } from "@/lib/services/analytics/dashboard";

function formatDeliveryStatus(status: string) {
  if (status === "paid") return "Paid";
  if (status === "failed_delivery") return "Failed delivery";
  return status;
}

function formatVerificationSource(source: string | undefined) {
  if (!source) return "Not provided";
  if (source === "okx-verify") return "OKX verify";
  if (source === "verification_failed") return "Verification failed";
  return source;
}

function getSettlementLabel(receipt: Record<string, unknown> | undefined) {
  const settlement =
    receipt &&
    typeof receipt === "object" &&
    !Array.isArray(receipt) &&
    "settlement" in receipt &&
    receipt.settlement &&
    typeof receipt.settlement === "object" &&
    !Array.isArray(receipt.settlement)
      ? (receipt.settlement as Record<string, unknown>)
      : undefined;

  if (!settlement) return "No settlement";
  if (settlement.settledOnchain === true) return "Settled onchain";
  if (settlement.skipped === true) return "Skipped";
  if (settlement.settledOnchain === false) return "Failed";
  return "No settlement";
}

export default async function DashboardPage() {
  const snapshot = await getLiveDashboardSnapshot();

  return (
    <main className="home-v2-page-shell">
      <div className="home-v2-page-grid">
        <section className="directory-v2-hero">
          <div className="home-v2-section-heading">
            <p className="home-v2-section-eyebrow">My records</p>
            <h1 className="home-v2-section-title install-v2-title">
              Payments, calls, and receipts
            </h1>
            <p className="home-v2-section-description install-v2-description">
              The agent handles discovery, payment, and invocation inside the Skill. This page is
              where you review the records that came back.
            </p>
          </div>
        </section>

        <section className="service-v2-summary-grid">
          <article className="service-v2-summary-card">
            <span>Total spend</span>
            <strong>{snapshot.totalIncome} USD</strong>
          </article>
          <article className="service-v2-summary-card">
            <span>Paid calls</span>
            <strong>{snapshot.paidCalls}</strong>
          </article>
          <article className="service-v2-summary-card">
            <span>Success rate</span>
            <strong>{snapshot.successRate}%</strong>
          </article>
          <article className="service-v2-summary-card">
            <span>Avg latency</span>
            <strong>{snapshot.avgLatencyMs} ms</strong>
          </article>
        </section>

        <section className="service-v2-logs-grid">
          <article className="service-v2-log-card">
            <h2 className="home-v2-trust-title">Recent payments and receipts</h2>
            {snapshot.recentTransactions.length === 0 ? (
              <p className="home-v2-trust-body">
                No payment or delivery record is available yet. Browse the directory first, then
                let the agent invoke a service.
              </p>
            ) : (
              <ul className="service-v2-log-list">
                {snapshot.recentTransactions.map((event) => (
                  <li key={event.transactionHash} className="service-v2-log-item">
                    <div className="service-v2-log-topline">
                      <span>{event.transactionHash}</span>
                      <span>{formatDeliveryStatus(event.status)}</span>
                    </div>
                    <div className="service-v2-log-meta">
                      <span>Payer {event.payerAddress ?? "unknown"}</span>
                      <span>Verification {formatVerificationSource(event.verificationSource)}</span>
                      <span>Settlement {getSettlementLabel(event.receipt)}</span>
                      <span>{event.latencyMs} ms</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="service-v2-log-card">
            <h2 className="home-v2-trust-title">Recent rejected attempts</h2>
            {snapshot.recentAttempts.length === 0 ? (
              <p className="home-v2-trust-body">No failed verification attempt is currently recorded.</p>
            ) : (
              <ul className="service-v2-log-list">
                {snapshot.recentAttempts.map((attempt, index) => (
                  <li
                    key={`${attempt.serviceSlug}-${attempt.proofDigest ?? index}`}
                    className="service-v2-log-item"
                  >
                    <div className="service-v2-log-topline">
                      <span>{attempt.serviceSlug}</span>
                      <span>{attempt.invalidReason}</span>
                    </div>
                    <div className="service-v2-log-meta">
                      <span>Payer {attempt.payerAddress ?? "unknown"}</span>
                      <span>Verification {formatVerificationSource(attempt.verificationSource)}</span>
                      <span>Quote v{attempt.quoteVersion ?? "?"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="home-v2-trust-grid">
          <article className="home-v2-trust-card">
            <h2 className="home-v2-trust-title">Rejected proofs</h2>
            <p className="home-v2-trust-body">{snapshot.rejectedAttempts}</p>
          </article>
          <article className="home-v2-trust-card">
            <h2 className="home-v2-trust-title">Failed deliveries</h2>
            <p className="home-v2-trust-body">{snapshot.failedDeliveries}</p>
          </article>
          <article className="home-v2-trust-card">
            <h2 className="home-v2-trust-title">What this page is for</h2>
            <p className="home-v2-trust-body">
              Use this view to review returned receipts and failures. Use the directory when you
              need to choose the next service.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
