export const APP = {
    name: "すうどく すてっぷ",
    storageKey: "sudoku-puzzle-v1"
  };
  
  export const LEVELS = [
    { size: 3, digits: 3 },
    { size: 4, digits: 4 },
    { size: 5, digits: 5 },
    { size: 6, digits: 6 },
    { size: 7, digits: 7 },
    { size: 8, digits: 8 },
    { size: 9, digits: 9 }
  ];

  export const LEVEL_BAND_LABELS = [
    { min: 3, max: 4, label: "れんしゅう" },
    { min: 5, max: 6, label: "チャレンジ" },
    { min: 7, max: 9, label: "めいじん" }
  ];

  export const LEVEL_STATUS_LABELS = {
    CLEAR: "クリア！",
    PLAY: "つづき",
    LOCK: "まだだよ"
  };

  export const DIFFICULTY_LABELS = {
    easy: "かんたん",
    normal: "ふつう",
    hard: "むずかしい"
  };

  export function getLevelBandLabel(size) {
    const target = LEVEL_BAND_LABELS.find((band) => size >= band.min && size <= band.max);
    return target ? target.label : "";
  }

  export function getLevelDisplayLabel(size) {
    const band = getLevelBandLabel(size);
    return band ? `${size}マス（${band}）` : `${size}マス`;
  }
  
  // 初期は「1レベルクリアで次レベル解放」にする想定
  export function isLevelUnlocked(progress, size) {
    const idx = LEVELS.findIndex((l) => l.size === size);
    if (idx <= 0) return true; // 最初（3）は常に解放
    const prevSize = LEVELS[idx - 1].size;
    return Boolean(progress.clearedLevels?.includes(prevSize));
  }
  
