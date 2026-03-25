export const SUPPORTED_PAYMENT_CURRENCIES = ["USDT", "USDG"] as const;

export type PaymentCurrency = (typeof SUPPORTED_PAYMENT_CURRENCIES)[number];

type PaymentAssetConfig = {
  currency: PaymentCurrency;
  symbol: PaymentCurrency;
  assetAddress?: string;
  decimals: number;
  chainIndex: string;
  network: string;
};

function getEnv(name: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function normalizePaymentCurrency(value: string | undefined): PaymentCurrency {
  const normalized = value?.trim().toUpperCase();
  if (
    normalized === "USDT" ||
    normalized === "USDG"
  ) {
    return normalized;
  }

  return "USDT";
}

export function getPaymentAssetConfig(currencyInput: string | undefined): PaymentAssetConfig {
  const currency = normalizePaymentCurrency(currencyInput);
  const assetAddress = getEnv(`PAYMENT_ASSET_ADDRESS_${currency}`);
  const decimalsValue = getEnv(`PAYMENT_ASSET_DECIMALS_${currency}`) ?? "6";
  const chainIndex = getEnv("XLAYER_CHAIN_INDEX") ?? "196";

  return {
    currency,
    symbol: currency,
    assetAddress,
    decimals: Number(decimalsValue),
    chainIndex,
    network: `eip155:${chainIndex}`
  };
}
