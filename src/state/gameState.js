import { loadStorage, saveStorage } from "./storage.js";

function defaultState() {
  return {
    settings: {
      bgmEnabled: true,
      sfx: true,
      sfxEnabled: true,
      highlightSameNumber: true,
      largeUI: false,
      guideMode: true,
      pencilMode: false,
      useGeneratedPuzzles: false,
      difficulty: "normal" // "easy" | "normal" | "hard"
    },
    progress: {
      clearedLevels: [3], // 初期：3は扱いやすいので「解放済み」として入れておく
      lastPlayed: null
    },
    session: {
      currentLevelSize: null,
      // 後でここに「盤面」「固定セル」「経過」などを追加
      inProgress: false,
      lastPuzzleId: null,
      grid: null,
      fixed: null,
      selected: null,
      puzzleNumbers: null,
      puzzleId: null,
      source: null,
      difficulty: null,
      hintUsedCount: 0,
      hintSuggestUsed: false,
      hintFillUsed: false
    }
  };
}

class GameState {
  constructor() {
    this._state = defaultState();
    this._listeners = new Set();
    this.hydrate();
  }

  hydrate() {
    const saved = loadStorage();
    if (!saved) return;

    // 破壊的変更を避けるため shallow merge
    const mergedSettings = { ...defaultState().settings, ...(saved.settings || {}) };
    if (mergedSettings.sfxEnabled == null) {
      mergedSettings.sfxEnabled = mergedSettings.sfx ?? true;
    }
    this._state = {
      ...defaultState(),
      ...saved,
      settings: mergedSettings,
      progress: { ...defaultState().progress, ...(saved.progress || {}) },
      session: { ...defaultState().session, ...(saved.session || {}) }
    };
  }

  get state() {
    return this._state;
  }

  setState(patch) {
    const mergedSettings = { ...this._state.settings, ...(patch.settings || {}) };
    if (patch.settings && "sfxEnabled" in patch.settings && !("sfx" in patch.settings)) {
      mergedSettings.sfx = mergedSettings.sfxEnabled;
    }
    this._state = {
      ...this._state,
      ...patch,
      settings: mergedSettings,
      progress: { ...this._state.progress, ...(patch.progress || {}) },
      session: { ...this._state.session, ...(patch.session || {}) }
    };
    saveStorage(this._state);
    this._emit();
  }

  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _emit() {
    for (const fn of this._listeners) fn(this._state);
  }

  markLevelCleared(size) {
    const cleared = new Set(this._state.progress.clearedLevels || []);
    cleared.add(size);
    this.setState({
      progress: {
        ...this._state.progress,
        clearedLevels: Array.from(cleared)
      }
    });
  }

  startSession(levelSize) {
    this.setState({
      session: {
        ...this._state.session,
        currentLevelSize: levelSize,
        inProgress: true
      },
      progress: {
        ...this._state.progress,
        lastPlayed: { levelSize, at: Date.now() }
      }
    });
  }

  endSession() {
    this.setState({
      session: {
        ...this._state.session,
        inProgress: false
      }
    });
  }
}

export const gameState = new GameState();
