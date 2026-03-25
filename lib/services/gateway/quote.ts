import { getPaymentAssetConfig } from "@/lib/services/gateway/payment-assets";

type PaymentQuoteInput = {
  serviceId: string;
  serviceSlug: string;
  priceAmount: string;
  payoutAddress: string;
  priceCurrency?: string;
};

export function createPaymentQuote(input: PaymentQuoteInput) {
  const assetConfig = getPaymentAssetConfig(input.priceCurrency);
  return {
    x402Version: 1,
    scheme: "exact",
    serviceId: input.serviceId,
    serviceSlug: input.serviceSlug,
    amount: input.priceAmount,
    asset: assetConfig.symbol,
    network: assetConfig.network,
    payTo: input.payoutAddress,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  };
}
