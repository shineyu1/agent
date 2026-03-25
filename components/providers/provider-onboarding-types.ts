export type SourceMode = "manual" | "openapi";

export type AccessMode = "hosted" | "relay";

export type Visibility = "listed" | "unlisted";
export type Stablecoin = "USDT" | "USDG";

export interface ProviderOnboardingDraft {
  providerId: string;
  serviceName: string;
  shortDescription: string;
  sourceMode: SourceMode;
  upstreamMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  upstreamBaseUrl: string;
  upstreamPath: string;
  openApiUrl: string;
  openApiOperationId: string;
  accessMode: AccessMode;
  hostedAuthType: "bearer";
  hostedSecret: string;
  relayUrl: string;
  relaySigningSecret: string;
  pricePerCall: string;
  priceCurrency: Stablecoin;
  payoutWallet: string;
  visibility: Visibility;
}
