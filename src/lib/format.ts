export function formatAudFromCents(cents: string | number | bigint): string {
  const value = typeof cents === "bigint" ? cents : BigInt(cents);
  const zero = BigInt(0);
  const hundred = BigInt(100);
  const negative = value < zero;
  const abs = negative ? -value : value;
  const whole = abs / hundred;
  const frac = abs % hundred;
  const text = `${whole.toString()}.${frac.toString().padStart(2, "0")}`;
  return `${negative ? "-" : ""}$${text}`;
}
