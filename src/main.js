import "./styles/globals.css";
import "./styles/screens.css";
import "./styles/sudoku.css";

import { ScreenManager } from "./screens/ScreenManager.js";
import { TitleScreen } from "./screens/TitleScreen.js";
import { LevelSelectScreen } from "./screens/LevelSelectScreen.js";
import { SettingsScreen } from "./screens/SettingsScreen.js";
import { GameScreen } from "./screens/GameScreen.js";
import { PauseScreen } from "./screens/PauseScreen.js";
import { ResultScreen } from "./screens/ResultScreen.js";

import { gameState } from "./state/gameState.js";

function ensureRoot() {
  const root = document.getElementById("app");
  if (!root) throw new Error("#app が見つかりません");
  return root;
}

const root = ensureRoot();

const screenManager = new ScreenManager(root, gameState);

// 画面登録
screenManager.register("title", TitleScreen);
screenManager.register("levels", LevelSelectScreen);
screenManager.register("settings", SettingsScreen);
screenManager.register("game", GameScreen);
screenManager.register("pause", PauseScreen);
screenManager.register("result", ResultScreen);

// 起動
screenManager.start("title");

// デバッグ用（必要ならコンソールから触れる）
window.__SM__ = screenManager;
window.__STATE__ = gameState;
