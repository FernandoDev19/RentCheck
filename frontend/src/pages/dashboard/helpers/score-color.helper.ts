export function scoreColor(score: number) {
  if (score >= 4) return "#16a34a";
  if (score >= 2.5) return "#d97706";
  return "#dc2626";
}