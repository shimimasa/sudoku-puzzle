export function getDigitsForLevel(level) {
  const normalized = Number(level);
  const size = Math.min(9, Math.max(1, Number.isFinite(normalized) ? normalized : 1));
  return Array.from({ length: size }, (_, i) => i + 1);
}
