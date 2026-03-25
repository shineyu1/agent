import type { ProviderOnboardingDraft, SourceMode } from "./provider-onboarding-types";

interface SourceModeSectionProps {
  value: Pick<
    ProviderOnboardingDraft,
    | "sourceMode"
    | "upstreamMethod"
    | "upstreamBaseUrl"
    | "upstreamPath"
    | "openApiUrl"
    | "openApiOperationId"
  >;
  onSourceModeChange: (value: SourceMode) => void;
  onFieldChange: (
    field:
      | "upstreamMethod"
      | "upstreamBaseUrl"
      | "upstreamPath"
      | "openApiUrl"
      | "openApiOperationId",
    value: string
  ) => void;
}

export function SourceModeSection({
  value,
  onSourceModeChange,
  onFieldChange
}: SourceModeSectionProps) {
  return (
    <fieldset className="provider-fieldset">
      <legend className="provider-legend">来源方式</legend>

      <div className="flex flex-wrap gap-3">
        <label className="provider-chip">
          <input
            type="radio"
            name="source-mode"
            value="manual"
            checked={value.sourceMode === "manual"}
            onChange={() => onSourceModeChange("manual")}
          />
          手动填写
        </label>
        <label className="provider-chip">
          <input
            type="radio"
            name="source-mode"
            value="openapi"
            checked={value.sourceMode === "openapi"}
            onChange={() => onSourceModeChange("openapi")}
          />
          导入 OpenAPI
        </label>
      </div>

      {value.sourceMode === "manual" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <label className="provider-label">
            <span className="provider-label-text">请求方法</span>
            <select
              value={value.upstreamMethod}
              onChange={(event) => onFieldChange("upstreamMethod", event.target.value)}
              className="provider-input"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </label>

          <label className="provider-label">
            <span className="provider-label-text">上游基础 URL</span>
            <input
              type="url"
              value={value.upstreamBaseUrl}
              onChange={(event) => onFieldChange("upstreamBaseUrl", event.target.value)}
              placeholder="https://api.example.com"
              className="provider-input"
            />
          </label>

          <label className="provider-label">
            <span className="provider-label-text">默认路径</span>
            <input
              type="text"
              value={value.upstreamPath}
              onChange={(event) => onFieldChange("upstreamPath", event.target.value)}
              placeholder="/v1/search"
              className="provider-input"
            />
          </label>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="provider-label">
            <span className="provider-label-text">OpenAPI 地址</span>
            <input
              type="url"
              value={value.openApiUrl}
              onChange={(event) => onFieldChange("openApiUrl", event.target.value)}
              placeholder="https://example.com/openapi.json"
              className="provider-input"
            />
          </label>

          <label className="provider-label">
            <span className="provider-label-text">操作 ID</span>
            <input
              type="text"
              value={value.openApiOperationId}
              onChange={(event) => onFieldChange("openApiOperationId", event.target.value)}
              placeholder="searchDocuments"
              className="provider-input"
            />
          </label>
        </div>
      )}
    </fieldset>
  );
}
