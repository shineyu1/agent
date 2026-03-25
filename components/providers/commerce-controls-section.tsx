import type { ProviderOnboardingDraft } from "./provider-onboarding-types";

interface CommerceControlsSectionProps {
  value: Pick<
    ProviderOnboardingDraft,
    "pricePerCall" | "priceCurrency" | "payoutWallet" | "visibility"
  >;
  onFieldChange: (
    field: "pricePerCall" | "priceCurrency" | "payoutWallet" | "visibility",
    value: string
  ) => void;
}

export function CommerceControlsSection({
  value,
  onFieldChange
}: CommerceControlsSectionProps) {
  return (
    <fieldset className="provider-fieldset">
      <legend className="provider-legend">价格、钱包与可见性</legend>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="provider-label md:col-span-2">
          <span className="provider-label-text">单次价格</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={value.pricePerCall}
            onChange={(event) => onFieldChange("pricePerCall", event.target.value)}
            placeholder="0.05"
            className="provider-input"
          />
        </label>

        <label className="provider-label">
          <span className="provider-label-text">稳定币</span>
          <select
            value={value.priceCurrency}
            onChange={(event) => onFieldChange("priceCurrency", event.target.value)}
            className="provider-input"
          >
            <option value="USDT">USDT</option>
            <option value="USDG">USDG</option>
          </select>
        </label>

        <label className="provider-label md:col-span-3">
          <span className="provider-label-text">收款钱包</span>
          <input
            type="text"
            value={value.payoutWallet}
            onChange={(event) => onFieldChange("payoutWallet", event.target.value)}
            placeholder="0x1234..."
            className="provider-input"
          />
        </label>

        <label className="provider-label md:col-span-3">
          <span className="provider-label-text">可见性</span>
          <select
            value={value.visibility}
            onChange={(event) => onFieldChange("visibility", event.target.value)}
            className="provider-input"
          >
            <option value="listed">公开展示</option>
            <option value="unlisted">仅私下分发</option>
          </select>
        </label>
      </div>
    </fieldset>
  );
}
