export const APP = {
    name: "すうどく すてっぷ",
    storageKey: "sudoku-puzzle-v1"
  };
  
  export const LEVELS = [
    { size: 3, label: "3マス（1〜3）", digits: 3 },
    { size: 4, label: "4マス（1〜4）", digits: 4 },
    { size: 5, label: "5マス（1〜5）", digits: 5 },
    { size: 6, label: "6マス（1〜6）", digits: 6 },
    { size: 7, label: "7マス（1〜7）", digits: 7 },
    { size: 8, label: "8マス（1〜8）", digits: 8 },
    { size: 9, label: "9マス（1〜9）", digits: 9 }
  ];
  
  // 初期は「1レベルクリアで次レベル解放」にする想定
  export function isLevelUnlocked(progress, size) {
    const idx = LEVELS.findIndex((l) => l.size === size);
    if (idx <= 0) return true; // 最初（3）は常に解放
    const prevSize = LEVELS[idx - 1].size;
    return Boolean(progress.clearedLevels?.includes(prevSize));
  }
  