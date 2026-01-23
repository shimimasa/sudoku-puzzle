const BADGE_DEFINITIONS = [
  {
    id: "perfect",
    label: "パーフェクト！",
    check: (stats) => stats.invalidAttempts === 0
  },
  {
    id: "self",
    label: "じぶんでできた！",
    check: (stats) => stats.totalHelp === 0
  },
  {
    id: "noPause",
    label: "しゅうちゅう！",
    check: (stats) => stats.resumeCount === 0 && stats.hasResumeCount
  },
  {
    id: "resilient",
    label: "あきらめない！",
    check: (stats) => stats.resumeCount >= 2
  },
  {
    id: "steady",
    label: "ねばりづよい！",
    check: (stats) => stats.durationSec >= 600
  }
];

const toNumber = (value) => (typeof value === "number" && !Number.isNaN(value) ? value : null);

export function getBadgesForLog(logEntry, limit = 2) {
  if (!logEntry) return [];
  const invalidAttempts = toNumber(logEntry.invalidAttempts) ?? 0;
  const durationSec = toNumber(logEntry.durationSec) ?? 0;
  const resumeCountRaw = toNumber(logEntry.resumeCount);
  const hasResumeCount = resumeCountRaw != null;
  const resumeCount = resumeCountRaw ?? 0;
  const helpUsedCounts = logEntry.helpUsedCounts || {};
  const helpValues = ["look", "narrow", "fill"].map((key) => toNumber(helpUsedCounts[key]) ?? 0);
  const sumHelp = helpValues.reduce((total, value) => total + value, 0);
  const hintUsedCount = toNumber(logEntry.hintUsedCount) ?? 0;
  const totalHelp = sumHelp || hintUsedCount;

  const stats = {
    invalidAttempts,
    durationSec,
    resumeCount,
    totalHelp,
    hasResumeCount
  };

  return BADGE_DEFINITIONS.filter((badge) => badge.check(stats))
    .slice(0, limit)
    .map(({ id, label }) => ({ id, label }));
}
