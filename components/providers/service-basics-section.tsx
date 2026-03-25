import type { ProviderOnboardingDraft } from "./provider-onboarding-types";

interface ServiceBasicsSectionProps {
  value: Pick<ProviderOnboardingDraft, "providerId" | "serviceName" | "shortDescription">;
  onProviderIdChange: (value: string) => void;
  onServiceNameChange: (value: string) => void;
  onShortDescriptionChange: (value: string) => void;
}

export function ServiceBasicsSection({
  value,
  onProviderIdChange,
  onServiceNameChange,
  onShortDescriptionChange
}: ServiceBasicsSectionProps) {
  return (
    <fieldset className="provider-fieldset">
      <legend className="provider-legend">服务基础信息</legend>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="provider-label">
          <span className="provider-label-text">服务商标识</span>
          <input
            type="text"
            value={value.providerId}
            onChange={(event) => onProviderIdChange(event.target.value)}
            placeholder="alpha-data"
            className="provider-input"
          />
        </label>

        <label className="provider-label">
          <span className="provider-label-text">服务名称</span>
          <input
            type="text"
            value={value.serviceName}
            onChange={(event) => onServiceNameChange(event.target.value)}
            placeholder="链上风险评分服务"
            className="provider-input"
          />
        </label>

        <label className="provider-label md:col-span-2">
          <span className="provider-label-text">服务简介</span>
          <textarea
            value={value.shortDescription}
            onChange={(event) => onShortDescriptionChange(event.target.value)}
            placeholder="给 Agent 提供一项明确、可按次付费的能力。"
            rows={4}
            className="provider-input min-h-[132px]"
          />
        </label>
      </div>
    </fieldset>
  );
}
