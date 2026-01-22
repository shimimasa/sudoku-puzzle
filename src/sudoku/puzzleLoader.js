const MANIFEST_URL = "/data/manifest.json";

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function loadRandomPuzzle(levelSize, { avoidId = null } = {}) {
  // 1) manifest を読む
  const mRes = await fetch(MANIFEST_URL, { cache: "no-store" });
  if (!mRes.ok) throw new Error("manifest.json を読み込めませんでした");
  const manifest = await mRes.json();

  const key = String(levelSize);
  const files = manifest[key];
  if (!files || files.length === 0) {
    throw new Error(`level${levelSize} の問題が登録されていません`);
  }

  // 2) ランダムに1つ選ぶ（直前と同じを避けたい場合）
  let file = randomPick(files);
  if (avoidId && files.length >= 2) {
    let guard = 0;
    while (`${key}/${file}` === avoidId && guard < 20) {
      file = randomPick(files);
      guard++;
    }
  }

  // 3) 問題JSONを読む
  const url = `/data/level${levelSize}/${file}`;
  const pRes = await fetch(url, { cache: "no-store" });
  if (!pRes.ok) throw new Error(`問題ファイルを読み込めません: ${url}`);

  const puzzle = await pRes.json();

  return {
    id: `${key}/${file}`,   // 例: "3/002.json"
    levelSize,
    url,
    puzzle
  };
}
