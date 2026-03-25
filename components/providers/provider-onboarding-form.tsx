"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { AccessModeSection } from "./access-mode-section";
import { CommerceControlsSection } from "./commerce-controls-section";
import { ServiceBasicsSection } from "./service-basics-section";
import { SourceModeSection } from "./source-mode-section";
import type {
  AccessMode,
  ProviderOnboardingDraft,
  SourceMode,
  Visibility
} from "./provider-onboarding-types";

const initialDraft: ProviderOnboardingDraft = {
  providerId: "",
  serviceName: "",
  shortDescription: "",
  sourceMode: "manual",
  upstreamMethod: "POST",
  upstreamBaseUrl: "",
  upstreamPath: "/v1",
  openApiUrl: "",
  openApiOperationId: "",
  accessMode: "hosted",
  hostedAuthType: "bearer",
  hostedSecret: "",
  relayUrl: "",
  relaySigningSecret: "",
  pricePerCall: "0.05",
  priceCurrency: "USDT",
  payoutWallet: "",
  visibility: "listed"
};

type SubmissionState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; slug: string }
  | { kind: "error"; message: string };

function buildPayload(draft: ProviderOnboardingDraft) {
  return {
    providerId: draft.providerId.trim(),
    name: draft.serviceName.trim(),
    summary: draft.shortDescription.trim(),
    sourceMode: draft.sourceMode,
    source:
      draft.sourceMode === "openapi"
        ? {
            type: "openapi",
            url: draft.openApiUrl.trim(),
            operationId: draft.openApiOperationId.trim()
          }
        : {
            type: "manual",
            method: draft.upstreamMethod,
            baseUrl: draft.upstreamBaseUrl.trim(),
            path: draft.upstreamPath.trim()
          },
    accessMode: draft.accessMode,
    access:
      draft.accessMode === "hosted"
        ? {
            authType: draft.hostedAuthType,
            secret: draft.hostedSecret.trim()
          }
        : {
            relayUrl: draft.relayUrl.trim(),
            signingSecret: draft.relaySigningSecret.trim()
          },
    pricing: {
      pricePerCall: Number(draft.pricePerCall),
      currency: draft.priceCurrency
    },
    payoutWallet: draft.payoutWallet.trim(),
    visibility: draft.visibility
  };
}

function validateDraft(draft: ProviderOnboardingDraft) {
  if (!draft.providerId.trim()) return "请填写服务商标识。";
  if (!draft.serviceName.trim()) return "请填写服务名称。";
  if (!draft.shortDescription.trim()) return "请填写服务简介。";
  if (draft.sourceMode === "openapi" && !draft.openApiUrl.trim()) {
    return "OpenAPI 模式需要填写 OpenAPI 地址。";
  }
  if (draft.sourceMode === "openapi" && !draft.openApiOperationId.trim()) {
    return "导入 OpenAPI 时需要填写操作 ID。";
  }
  if (draft.sourceMode === "manual" && !draft.upstreamBaseUrl.trim()) {
    return "手动模式需要填写上游基础 URL。";
  }
  if (draft.accessMode === "hosted" && !draft.hostedSecret.trim()) {
    return "托管转发模式需要填写托管凭证。";
  }
  if (draft.accessMode === "relay" && !draft.relayUrl.trim()) {
    return "自托管中继模式需要填写中继地址。";
  }
  if (draft.accessMode === "relay" && !draft.relaySigningSecret.trim()) {
    return "自托管中继模式需要填写中继签名密钥。";
  }
  if (!draft.payoutWallet.trim()) return "请填写收款钱包。";

  const price = Number(draft.pricePerCall);
  if (!Number.isFinite(price) || price <= 0) {
    return "单次价格必须大于 0。";
  }

  return null;
}

export function ProviderOnboardingForm() {
  const [draft, setDraft] = useState(initialDraft);
  const [submission, setSubmission] = useState<SubmissionState>({ kind: "idle" });

  const updateField = <K extends keyof ProviderOnboardingDraft>(
    field: K,
    value: ProviderOnboardingDraft[K]
  ) => {
    setDraft((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateDraft(draft);
    if (validationError) {
      setSubmission({ kind: "error", message: validationError });
      return;
    }

    setSubmission({ kind: "submitting" });

    try {
      const response = await fetch("/api/providers/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildPayload(draft))
      });

      const contentType = response.headers.get("content-type") ?? "";
      let body: unknown = null;
      if (contentType.includes("application/json")) {
        body = await response.json();
      } else {
        body = await response.text();
      }

      if (!response.ok) {
        let message = `请求失败 (${response.status})`;
        if (typeof body === "object" && body && "error" in body) {
          message = String((body as { error?: unknown }).error ?? message);
        } else if (typeof body === "object" && body && "message" in body) {
          message = String((body as { message?: unknown }).message ?? message);
        } else if (
          typeof body === "string" &&
          body.trim() &&
          !body.trim().startsWith("<")
        ) {
          message = body.trim();
        }

        throw new Error(message);
      }

      const slug =
        typeof body === "object" &&
        body &&
        "slug" in body &&
        typeof (body as { slug?: unknown }).slug === "string"
          ? (body as { slug: string }).slug
          : "service";

      setSubmission({ kind: "success", slug });
    } catch (error) {
      setSubmission({
        kind: "error",
        message: error instanceof Error ? error.message : "无法创建服务，请稍后重试。"
      });
    }
  };

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <ServiceBasicsSection
        value={draft}
        onProviderIdChange={(value) => updateField("providerId", value)}
        onServiceNameChange={(value) => updateField("serviceName", value)}
        onShortDescriptionChange={(value) => updateField("shortDescription", value)}
      />

      <SourceModeSection
        value={draft}
        onSourceModeChange={(value: SourceMode) => updateField("sourceMode", value)}
        onFieldChange={(field, value) => updateField(field, value)}
      />

      <AccessModeSection
        value={draft}
        onChange={(value: AccessMode) => updateField("accessMode", value)}
        onFieldChange={(field, value) => updateField(field, value)}
      />

      <CommerceControlsSection
        value={draft}
        onFieldChange={(field, value) => {
          if (field === "visibility") {
            updateField(field, value as Visibility);
            return;
          }

          updateField(field, value);
        }}
      />

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={submission.kind === "submitting"}
          className="app-primary-button rounded-full px-6 py-3 text-sm font-semibold text-[#061320] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submission.kind === "submitting" ? "创建中..." : "创建服务"}
        </button>

        {submission.kind === "success" ? (
          <p
            role="status"
            className="rounded-full border border-emerald-400/30 bg-emerald-500/12 px-4 py-2 text-sm text-emerald-100"
          >
            已创建 {submission.slug}
            {" "}
            <a
              href={`/providers/${submission.slug}`}
              className="ml-2 font-semibold underline underline-offset-4"
            >
              查看服务
            </a>
          </p>
        ) : null}

        {submission.kind === "error" ? (
          <p
            role="alert"
            className="rounded-full border border-rose-400/30 bg-rose-500/12 px-4 py-2 text-sm text-rose-100"
          >
            {submission.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
