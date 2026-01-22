import { generatePuzzleWithRetry } from "./generator.js";

const MANIFEST_URL = "/data/manifest.json";

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}


function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
/**
+ * public/data/manifest.json を参照し、
+ * public/data/level{N}/ 配下の問題JSONからランダムに1つロードする。
+ *
+ * @param {number} levelSize 3..9
+ * @param {{avoidId?: string|null}} options 直前と同じ問題を避けたい時に指定（例: "3/001.json"）
+ */
export async function loadRandomPuzzle(levelSize, { avoidId = null } = {}) {
  // 1) manifest を読む（Vercel静的環境ではディレクトリ一覧が取れないため必須）
  const mRes = await fetch(MANIFEST_URL, { cache: "no-store" });
  if (!mRes.ok) throw new Error("manifest.json を読み込めませんでした");
  const manifest = await mRes.json();

  const key = String(levelSize);
  const files = manifest[key];
  if (!files || files.length === 0) {
    throw new Error(`level${levelSize} の問題が登録されていません`);
  }

  // 2) 試行順を作る（直前と同じを避ける／404でも落ちないように複数試す）
  let candidates = shuffle(files);
  if (avoidId && candidates.length >= 2) {
    candidates = candidates.filter((f) => `${key}/${f}` !== avoidId);
    // 全部消えた場合は元に戻す
    if (candidates.length === 0) candidates = shuffle(files);
  }

  const errors = [];

  // 3) 候補を順番に試す（manifestがズレていても生存する）
  for (const file of candidates) {
    const url = `/data/level${levelSize}/${file}`;
    try {
      const pRes = await fetch(url, { cache: "no-store" });
      if (!pRes.ok) {
        errors.push(`${url} (${pRes.status})`);
        continue;
      }
      const puzzle = await pRes.json();
      return { id: `${key}/${file}`, levelSize, url, puzzle };
    } catch (e) {
      errors.push(`${url} (${e?.message || "fetch/json error"})`);
      continue;
    }
  }

  // ここまで来たら「全部ダメ」
  throw new Error(
    `問題ファイルを読み込めませんでした: level${levelSize} / tried=${errors.join(", ")}`
  );


}

function generatePuzzle(levelSize) {
  // 生成が失敗しないようにリトライ付きの安全フローを使う
  const puzzle = generatePuzzleWithRetry(levelSize, {
    difficulty: "normal",
    maxRetries: 5
  });
  return { puzzle, id: `gen:${levelSize}:${Date.now()}`, url: null };
}

/**
 * 出題取得を1か所に集約：
 * - preferGenerated が true なら必ず生成
 * - JSONロードに失敗したら必ず生成にフォールバック
 *
 * @param {number} levelSize 3..9
 * @param {{avoidId?: string|null, preferGenerated?: boolean}} options
 */
export async function getPuzzle(
  levelSize,
  { avoidId = null, preferGenerated = false, difficulty = "normal" } = {}
) {
  if (preferGenerated) {
    const puzzle = generatePuzzleWithRetry(levelSize, { difficulty, maxRetries: 5 });
    const g = { puzzle, id: `gen:${levelSize}:${Date.now()}`, url: null };
    return { id: g.id, levelSize, url: g.url, puzzle: g.puzzle, source: "generated" };
  }

  try {
    const loaded = await loadRandomPuzzle(levelSize, { avoidId });
    return { ...loaded, source: "json" };
  } catch (_e) {
    const puzzle = generatePuzzleWithRetry(levelSize, { difficulty, maxRetries: 5 });
    const g = { puzzle, id: `gen:${levelSize}:${Date.now()}`, url: null };
    return { id: g.id, levelSize, url: g.url, puzzle: g.puzzle, source: "generated" };
  }
}