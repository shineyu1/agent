import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceHealthMetrics } from "@/lib/services/analytics/service-health";
import { listPaymentAttempts } from "@/lib/services/gateway/payment-attempt-store";
import { listPaymentEvents } from "@/lib/services/gateway/payment-event-store";
import { getServiceBySlug } from "@/lib/services/registry/service-store";

type ProviderServicePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatEventStatus(status: string) {
  if (status === "paid") return "已完成";
  if (status === "failed_delivery") return "调用失败";
  return status;
}

function formatVerification(value?: string) {
  if (value === "okx-verify") return "OKX 验签";
  if (value === "verification_failed") return "验证失败";
  return value ?? "未提供";
}

export default async function ProviderServicePage({ params }: ProviderServicePageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) notFound();

  const [events, attempts] = await Promise.all([
    listPaymentEvents(),
    listPaymentAttempts()
  ]);
  const serviceEvents = events.filter((event) => event.serviceSlug === slug).slice(0, 3);
  const serviceAttempts = attempts.filter((attempt) => attempt.serviceSlug === slug).slice(0, 3);
  const serviceHealth = getServiceHealthMetrics(slug, events, attempts);
  const payablePath = `/api/services/${slug}`;
  const serviceCardPath = `/services/${slug}`;

  return (
    <main className="min-h-screen px-6 py-14 md:px-8 md:py-18">
      <div className="mx-auto grid max-w-5xl gap-8">
        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[var(--accent)]">
          <Link href="/providers" className="underline underline-offset-4">
            返回服务商工作台
          </Link>
          <Link href="/providers/new" className="underline underline-offset-4">
            再接入一个服务
          </Link>
          <Link href="/dashboard" className="underline underline-offset-4">
            查看我的记录
          </Link>
        </div>

        <section className="app-panel rounded-[36px] p-8">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <p className="app-kicker">服务商详情</p>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white">
                {service.name}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-[var(--muted)]">
                {service.description}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <article className="app-panel-soft rounded-[24px] p-5">
                <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                  上架状态
                </h2>
                <p className="mt-3 text-xl font-semibold text-white">
                  {service.listingState === "LISTED" ? "公开展示" : "仅私下分发"}
                </p>
              </article>
              <article className="app-panel-soft rounded-[24px] p-5">
                <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                  交付方式
                </h2>
                <p className="mt-3 text-xl font-semibold text-white">
                  {service.credentialMode === "HOSTED" ? "托管转发" : "自托管中继"}
                </p>
              </article>
              <article className="app-panel-soft rounded-[24px] p-5">
                <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                  单次价格
                </h2>
                <p className="mt-3 text-xl font-semibold text-white">
                  {service.priceAmount} USD
                </p>
              </article>
              <article className="app-panel-soft rounded-[24px] p-5">
                <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                  可支付接口
                </h2>
                <p className="mt-3 break-all text-sm font-semibold text-white">{payablePath}</p>
              </article>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <article className="app-panel-soft rounded-[24px] p-5">
                <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                  已完成调用
                </h2>
                <p className="mt-3 text-xl font-semibold text-white">
                  {serviceHealth.recentPaidCallCount}
                </p>
              </article>
              <article className="app-panel-soft rounded-[24px] p-5">
                <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                  成功率
                </h2>
                <p className="mt-3 text-xl font-semibold text-white">
                  {(serviceHealth.successRate * 100).toFixed(1)}%
                </p>
              </article>
              <article className="app-panel-soft rounded-[24px] p-5">
                <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                  被拒绝证明
                </h2>
                <p className="mt-3 text-xl font-semibold text-white">
                  {serviceHealth.rejectedProofCount}
                </p>
              </article>
              <article className="app-panel-soft rounded-[24px] p-5">
                <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                  平均延迟
                </h2>
                <p className="mt-3 text-xl font-semibold text-white">
                  {serviceHealth.avgLatencyMs} ms
                </p>
              </article>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="app-panel-soft grid gap-3 rounded-[28px] p-5">
                <h2 className="text-lg font-semibold text-white">分发与调用</h2>
                <p className="text-sm leading-7 text-[var(--muted)]">
                  这是给 Agent 使用的可支付接口。你可以复制它做私下分发，也可以配合公开目录给用户侧展示。
                </p>
                <div className="rounded-[20px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm">
                  <p className="font-medium text-white">可支付接口</p>
                  <p className="mt-2 break-all text-[var(--muted)]">{payablePath}</p>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm">
                  <p className="font-medium text-white">用户详情页</p>
                  <p className="mt-2 break-all text-[var(--muted)]">{serviceCardPath}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <Link
                    href={serviceCardPath}
                    className="font-semibold text-[var(--accent)] underline underline-offset-4 decoration-[rgba(159,220,255,0.3)]"
                  >
                    查看用户详情页
                  </Link>
                  {service.listingState === "LISTED" ? (
                    <Link
                      href="/directory"
                      className="font-semibold text-[var(--accent)] underline underline-offset-4 decoration-[rgba(159,220,255,0.3)]"
                    >
                      已展示在服务目录
                    </Link>
                  ) : (
                    <span className="text-[var(--muted)]">当前未公开展示</span>
                  )}
                </div>
              </article>

              <article className="app-panel-soft grid gap-3 rounded-[28px] p-5">
                <h2 className="text-lg font-semibold text-white">来源与交付</h2>
                <dl className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                    <dt className="text-[var(--muted)]">来源方式</dt>
                    <dd className="font-semibold text-white">
                      {service.sourceKind === "MANUAL" ? "手动接入" : "导入 OpenAPI"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                    <dt className="text-[var(--muted)]">凭证模式</dt>
                    <dd className="font-semibold text-white">
                      {service.credentialMode === "HOSTED" ? "托管转发" : "自托管中继"}
                    </dd>
                  </div>
                  <div className="grid gap-2 rounded-[20px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                    <dt className="text-[var(--muted)]">上游目标</dt>
                    <dd className="break-all font-semibold text-white">
                      {service.sourceKind === "MANUAL"
                        ? (service.upstreamUrl ?? "未提供")
                        : (service.specUrl ?? "未提供")}
                    </dd>
                  </div>
                </dl>
              </article>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="app-panel-soft grid gap-4 rounded-[28px] p-5">
                <h2 className="text-lg font-semibold text-white">最近支付活动</h2>
                {serviceEvents.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    这个服务还没有支付或已交付请求记录。
                  </p>
                ) : (
                  <ul className="grid gap-3 text-sm">
                    {serviceEvents.map((event) => (
                      <li
                        key={event.transactionHash}
                        className="grid gap-2 rounded-[20px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="font-medium text-white">{event.transactionHash}</span>
                          <span className="text-[var(--muted)]">
                            {formatEventStatus(event.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-[var(--muted)]">
                          <span>付款方 {event.payerAddress ?? "未知地址"}</span>
                          <span>验证 {formatVerification(event.verificationSource)}</span>
                          <span>报价版本 v{event.quoteVersion ?? "?"}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="app-panel-soft grid gap-4 rounded-[28px] p-5">
                <h2 className="text-lg font-semibold text-white">被拒绝的证明</h2>
                {serviceAttempts.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    这个服务当前没有验证失败记录。
                  </p>
                ) : (
                  <ul className="grid gap-3 text-sm">
                    {serviceAttempts.map((attempt, index) => (
                      <li
                        key={`${attempt.serviceSlug}-${attempt.proofDigest ?? index}`}
                        className="grid gap-2 rounded-[20px] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="font-medium text-white">{attempt.invalidReason}</span>
                          <span className="text-[var(--muted)]">{attempt.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-[var(--muted)]">
                          <span>付款方 {attempt.payerAddress ?? "未知地址"}</span>
                          <span>验证 {formatVerification(attempt.verificationSource)}</span>
                          <span>报价版本 v{attempt.quoteVersion ?? "?"}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
