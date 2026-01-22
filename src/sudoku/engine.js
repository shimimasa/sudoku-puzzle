
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
