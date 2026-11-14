/** Exact money helpers using integer minor units (AUD cents). */

export type Cents = bigint;

export function cents(value: number | string | bigint): Cents {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new Error("Money amounts must be integer cents");
    }
    return BigInt(value);
  }
  if (!/^-?\d+$/.test(value)) {
    throw new Error("Money amounts must be integer cents");
  }
  return BigInt(value);
}

export function formatAud(centsValue: Cents): string {
  const zero = BigInt(0);
  const hundred = BigInt(100);
  const negative = centsValue < zero;
  const abs = negative ? -centsValue : centsValue;
  const whole = abs / hundred;
  const frac = abs % hundred;
  const formatted = `${whole.toString()}.${frac.toString().padStart(2, "0")}`;
  return negative ? `-$${formatted}` : `$${formatted}`;
}

/** Half-up GST from exclusive net at rate in basis points (1000 = 10%). */
export function taxFromExclusive(netCents: Cents, rateBp: number): Cents {
  if (rateBp < 0) throw new Error("Tax rate cannot be negative");
  const numerator = netCents * BigInt(rateBp);
  const denominator = BigInt(10000);
  return (numerator + denominator / BigInt(2)) / denominator;
}

/** Split GST-inclusive gross into net + tax at rateBp. */
export function splitInclusive(
  grossCents: Cents,
  rateBp: number,
): { netCents: Cents; taxCents: Cents } {
  if (rateBp < 0) throw new Error("Tax rate cannot be negative");
  const divisor = BigInt(10000) + BigInt(rateBp);
  const netCents = (grossCents * BigInt(10000) + divisor / BigInt(2)) / divisor;
  const taxCents = grossCents - netCents;
  return { netCents, taxCents };
}
