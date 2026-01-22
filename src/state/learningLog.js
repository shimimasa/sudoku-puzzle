import { APP } from "../config.js";

const STORAGE_KEY = `${APP.storageKey}:learningLogs`;
const MAX_LOGS = 200;

function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // ログ保存失敗でもゲーム進行は止めない
  }
}

function generateId() {
  return `log:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export function createLearningLog({
  levelSize,
  difficulty,
  source,
  puzzleId,
  guideMode,
  pencilMode
}) {
  return {
    id: generateId(),
    tsStart: Date.now(),
    tsEnd: 0,
    durationSec: 0,
    levelSize,
    difficulty,
    source,
    puzzleId,
    result: "abandoned",
    moves: 0,
    erasures: 0,
    invalidAttempts: 0,
    guideMode,
    pencilMode,
    hintUsedCount: 0
  };
}

export function finalizeLearningLog(log, { result, tsEnd = Date.now() } = {}) {
  const durationSec = Math.max(0, Math.round((tsEnd - log.tsStart) / 1000));
  return {
    ...log,
    tsEnd,
    durationSec,
    result
  };
}

export function appendLearningLog(log) {
  const logs = loadLogs();
  logs.push(log);
  const trimmed = logs.length > MAX_LOGS ? logs.slice(-MAX_LOGS) : logs;
  saveLogs(trimmed);
}
