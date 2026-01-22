import { loadStorage, saveStorage } from "./storage.js";

function defaultState() {
  return {
    settings: {
      sfx: true,
      highlightSameNumber: true,
      largeUI: false,
      guideMode: true,
      useGeneratedPuzzles: false
    },
    progress: {
      clearedLevels: [3], // 初期：3は扱いやすいので「解放済み」として入れておく
      lastPlayed: null
    },
    session: {
      currentLevelSize: null,
      // 後でここに「盤面」「固定セル」「経過」などを追加
      inProgress: false,
      lastPuzzleId: null
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
    this._state = {
      ...defaultState(),
      ...saved,
      settings: { ...defaultState().settings, ...(saved.settings || {}) },
      progress: { ...defaultState().progress, ...(saved.progress || {}) },
      session: { ...defaultState().session, ...(saved.session || {}) }
    };
  }

  get state() {
    return this._state;
  }

  setState(patch) {
    this._state = {
      ...this._state,
      ...patch,
      settings: { ...this._state.settings, ...(patch.settings || {}) },
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
