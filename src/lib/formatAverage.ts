/**
 * Averages render with at most two decimals ("8.75", "8.7", "9"); anything
 * unparsable falls back to an em dash.
 */
export function formatAverage(
  raw: string | number | undefined | null,
): string {
  const value =
    typeof raw === "number" ? raw : Number.parseFloat((raw ?? "").trim());
  if (!Number.isFinite(value)) return "—";
  return String(Math.round(value * 100) / 100);
}
