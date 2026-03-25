export function toBaseUnits(amount: string, decimals: number) {
  const normalizedAmount = amount.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalizedAmount) || decimals < 0) {
    throw new Error("Invalid price amount");
  }

  const [integerPart, fractionalPart = ""] = normalizedAmount.split(".");
  if (fractionalPart.length > decimals) {
    throw new Error("Invalid price amount");
  }

  const paddedFraction = fractionalPart.padEnd(decimals, "0");
  const baseUnits = `${integerPart}${paddedFraction}`.replace(/^0+(?=\d)/, "");

  return baseUnits === "" ? "0" : baseUnits;
}
