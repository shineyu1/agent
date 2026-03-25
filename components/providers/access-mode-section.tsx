import type { AccessMode } from "./provider-onboarding-types";

interface AccessModeSectionProps {
  value: Pick<
    import("./provider-onboarding-types").ProviderOnboardingDraft,
    "accessMode" | "hostedAuthType" | "hostedSecret" | "relayUrl" | "relaySigningSecret"
  >;
  onChange: (value: AccessMode) => void;
  onFieldChange: (
    field: "hostedAuthType" | "hostedSecret" | "relayUrl" | "relaySigningSecret",
    value: string
  ) => void;
}

export function AccessModeSection({
  value,
  onChange,
  onFieldChange
}: AccessModeSectionProps) {
  return (
    <fieldset className="provider-fieldset">
      <legend className="provider-legend">交付方式</legend>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="provider-choice">
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <input
              type="radio"
              name="access-mode"
              value="hosted"
              checked={value.accessMode === "hosted"}
              onChange={() => onChange("hosted")}
            />
            托管转发（Hosted）
          </span>
          <span className="text-sm leading-6 text-[var(--muted)]">
            由平台负责转发和交付，更适合快速上线。
          </span>
        </label>

        <label className="provider-choice">
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <input
              type="radio"
              name="access-mode"
              value="relay"
              checked={value.accessMode === "relay"}
              onChange={() => onChange("relay")}
            />
            自托管中继（Relay）
          </span>
          <span className="text-sm leading-6 text-[var(--muted)]">
            由服务商自己维护中继接口，保留更高的控制权和安全边界。
          </span>
        </label>
      </div>

      {value.accessMode === "hosted" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="provider-label">
            <span className="provider-label-text">鉴权方式</span>
            <select
              value={value.hostedAuthType}
              onChange={(event) => onFieldChange("hostedAuthType", event.target.value)}
              className="provider-input"
            >
              <option value="bearer">Bearer Token</option>
            </select>
          </label>

          <label className="provider-label">
            <span className="provider-label-text">托管凭证</span>
            <input
              type="password"
              value={value.hostedSecret}
              onChange={(event) => onFieldChange("hostedSecret", event.target.value)}
              placeholder="sk_live_..."
              className="provider-input"
            />
          </label>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="provider-label">
            <span className="provider-label-text">中继地址</span>
            <input
              type="url"
              value={value.relayUrl}
              onChange={(event) => onFieldChange("relayUrl", event.target.value)}
              placeholder="https://relay.example.com/fulfill"
              className="provider-input"
            />
          </label>

          <label className="provider-label">
            <span className="provider-label-text">中继签名密钥</span>
            <input
              type="password"
              value={value.relaySigningSecret}
              onChange={(event) => onFieldChange("relaySigningSecret", event.target.value)}
              placeholder="relay-signing-secret"
              className="provider-input"
            />
          </label>
        </div>
      )}
    </fieldset>
  );
}
