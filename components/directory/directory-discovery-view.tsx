"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/layout/language-provider";
import { directoryCopy, directorySortOptions } from "@/lib/content/directory-copy";
import { groupDirectoryServices } from "@/lib/services/discovery/directory-groups";
import type { DirectoryService } from "@/lib/services/discovery/directory-service";

type DirectorySort = keyof typeof directorySortOptions;

function formatPrice(price: string) {
  const [amount] = price.split(" ");
  return `$${amount}`;
}

function formatRate(rate: number) {
  return `${(rate * 100).toFixed(1)}%`;
}

function sortHref(sort: DirectorySort) {
  return `/directory?sortBy=${sort}`;
}

export function DirectoryDiscoveryView({
  services,
  selectedSort
}: {
  services: DirectoryService[];
  selectedSort: DirectorySort;
}) {
  const { language } = useLanguage();
  const copy = directoryCopy[language];
  const groupedServices = groupDirectoryServices(services);

  return (
    <main className="pb-24 pt-12">
      <section className="flex flex-col gap-4">
        <p
          className="m-0 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          {copy.hero.eyebrow}
        </p>
        <h1
          className="m-0 text-4xl font-semibold text-white sm:text-5xl"
          style={{ letterSpacing: "-0.03em" }}
        >
          {copy.hero.title}
        </h1>
        <p className="m-0 max-w-2xl text-base leading-relaxed" style={{ color: "var(--muted)" }}>
          {copy.hero.subtitle}
        </p>
      </section>

      <section className="mt-8 flex flex-wrap items-center gap-2">
        {(Object.keys(directorySortOptions) as DirectorySort[]).map((value) => {
          const active = value === selectedSort;
          return (
            <Link
              key={value}
              href={sortHref(value)}
              className="inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold uppercase tracking-wider no-underline transition-all"
              style={
                active
                  ? {
                      background: "rgba(142,164,255,0.12)",
                      border: "1px solid rgba(142,164,255,0.28)",
                      color: "#ffffff"
                    }
                  : {
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--muted)"
                    }
              }
            >
              {copy.sorting.prefix}
              {copy.sorting.labels[value]}
            </Link>
          );
        })}
      </section>

      {services.length === 0 ? (
        <section
          className="mt-6 rounded-2xl p-10 text-center"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="m-0 text-xl font-semibold text-white">{copy.empty.title}</h2>
          <p className="m-0 mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {copy.empty.body}
          </p>
        </section>
      ) : (
        <section className="mt-14 flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <p
              className="m-0 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              {copy.sections.eyebrow}
            </p>
            <h2
              className="m-0 text-3xl font-semibold text-white sm:text-4xl"
              style={{ letterSpacing: "-0.03em" }}
            >
              {copy.sections.title}
            </h2>
            <p className="m-0 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {copy.sections.subtitle}
            </p>
          </div>

          {groupedServices.map((group) => (
            <section key={group.key} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-1">
                  <h3
                    className="m-0 text-2xl font-semibold text-white"
                    style={{ letterSpacing: "-0.03em" }}
                  >
                    {copy.sections.labels[group.key].title}
                  </h3>
                  <p className="m-0 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                    {copy.sections.labels[group.key].description}
                  </p>
                </div>
                <span
                  className="inline-flex h-8 w-fit items-center rounded-full px-3 text-[11px] font-semibold uppercase tracking-wider"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)",
                    color: "var(--muted)"
                  }}
                >
                  {group.services.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.services.map((service) => (
                  <article
                    key={service.id}
                    className="flex flex-col gap-5 rounded-2xl p-6 transition-all hover:-translate-y-0.5"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className="m-0 text-[10px] font-semibold uppercase tracking-widest"
                            style={{ color: "var(--muted)" }}
                          >
                            {service.category}
                          </p>
                          {service.status ? (
                            <span
                              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                              style={
                                service.status === "comingSoon"
                                  ? {
                                      background: "rgba(199,214,255,0.08)",
                                      border: "1px solid rgba(199,214,255,0.2)",
                                      color: "#dbe5ff"
                                    }
                                  : {
                                      background: "rgba(255,194,92,0.12)",
                                      border: "1px solid rgba(255,194,92,0.25)",
                                      color: "#ffd99a"
                                    }
                              }
                            >
                              {copy.card.statusLabels[service.status]}
                            </span>
                          ) : null}
                        </div>
                        <h4
                          className="m-0 text-2xl font-semibold text-white"
                          style={{ letterSpacing: "-0.03em" }}
                        >
                          {service.name}
                        </h4>
                      </div>
                      <span
                        className="flex-shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid var(--border)",
                          color: "#c7d6ff"
                        }}
                      >
                        {formatPrice(service.price)}
                      </span>
                    </div>

                    <p className="m-0 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                      {service.description}
                    </p>

                    {service.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {service.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid var(--border)",
                              color: "var(--muted)"
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: copy.card.priceLabel, value: formatPrice(service.price) },
                        { label: copy.card.successRateLabel, value: formatRate(service.successRate) },
                        { label: copy.card.latencyLabel, value: `${service.avgLatencyMs} ms` },
                        {
                          label: copy.card.recentPaidCallsLabel,
                          value: String(service.recentPaidCallCount)
                        }
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex flex-col gap-1 rounded-xl p-3"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid var(--border)"
                          }}
                        >
                          <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                            {label}
                          </span>
                          <strong className="text-base font-semibold text-white">{value}</strong>
                        </div>
                      ))}
                    </div>

                    <div
                      className="flex flex-col gap-3 pt-3"
                      style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span>{service.providerName}</span>
                        {service.detailPath ? (
                          <Link
                            href={service.detailPath}
                            className="font-semibold no-underline transition-opacity hover:opacity-70"
                            style={{ color: "#c7d6ff" }}
                          >
                            {copy.card.detailLabel}
                          </Link>
                        ) : null}
                      </div>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {copy.card.useHint}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>
      )}
    </main>
  );
}
