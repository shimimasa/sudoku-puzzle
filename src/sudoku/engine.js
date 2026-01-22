
// 数独の最小判定ロジック（Phase1: Lv3想定）

export function canPlace(grid, row, col, value) {
  if (value === 0) return true;

  const size = grid.length;

  // 行チェック
  for (let c = 0; c < size; c++) {
    if (c !== col && grid[row][c] === value) return false;
  }

  // 列チェック
  for (let r = 0; r < size; r++) {
    if (r !== row && grid[r][col] === value) return false;
  }

  // ブロックチェック（Lv3では size=3 → 3x3 全体）
  const blockSize = Math.sqrt(size);
  if (Number.isInteger(blockSize)) {
    const br = Math.floor(row / blockSize) * blockSize;
    const bc = Math.floor(col / blockSize) * blockSize;
    for (let r = br; r < br + blockSize; r++) {
      for (let c = bc; c < bc + blockSize; c++) {
        if ((r !== row || c !== col) && grid[r][c] === value) {
          return false;
        }
      }
    }
  }

  return true;
}

export function isCleared(grid) {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) return false;
    }
  }
  return true;
}

// 空マスの候補（鉛筆）を計算
// return: candidates[r][c] = number[]  （埋まっているマスは []）
export function computeCandidates(grid, numbers) {
    const size = grid.length;
    const out = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => [])
    );
  
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== 0) continue;
        const cand = [];
        for (const n of numbers) {
          if (canPlace(grid, r, c, n)) cand.push(n);
        }
        out[r][c] = cand;
      }
    }
    return out;
  }
  
  // ヒント（1手）：
  // 1) 候補1つのマス（Naked Single）を最優先
  // 2) それが無ければ、候補数が最小のマスを示す（埋める値は決めない）
  export function findHint(grid, numbers) {
    const candidates = computeCandidates(grid, numbers);
    const size = grid.length;
  
    let best = null; // { r, c, candCount, candidates: number[] }
  
  for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== 0) continue;
        const cand = candidates[r][c];
        if (!cand || cand.length === 0) continue;
  
        if (cand.length === 1) {
          return { type: "single", r, c, value: cand[0], candidates };
        }
  
        if (!best || cand.length < best.candCount) {
          best = { r, c, candCount: cand.length, candidates: cand };
        }
      }
    }
  
    if (best) {
      return { type: "suggest", r: best.r, c: best.c, candidates };
    }
  
    return { type: "none", candidates };
  }