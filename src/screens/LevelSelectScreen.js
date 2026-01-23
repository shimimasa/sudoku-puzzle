import { el } from "../ui/dom.js";
import { LEVELS, getLevelDisplayLabel, isLevelUnlocked } from "../config.js";
import { HeaderBar, Panel, LevelCard } from "../ui/components.js";

export class LevelSelectScreen {
  constructor(screenManager, gameState, params = {}) {
    this.sm = screenManager;
    this.gs = gameState;
    this.params = params;
    this.name = "levels";
    this._root = null;
  }

  mount(container) {
    const { progress } = this.gs.state;

    const wrap = el("div", { className: "screen screen--menu" });
    const header = HeaderBar({
      title: "レベルをえらぶ",
      onBack: () => this.sm.back("title"),
      onSettings: () => this.sm.changeScreen("settings", { backTo: "levels" })
    });

    const panel = Panel({ wide: true });
    panel.appendChild(el("p", { className: "sub", text: "できるところから、1つずつ。" }));

    const grid = el("div", { className: "levelGrid" });

    for (const lv of LEVELS) {
      const unlocked = isLevelUnlocked(progress, lv.size);
      const cleared = (progress.clearedLevels || []).includes(lv.size);

      const card = LevelCard({
        level: { ...lv, label: getLevelDisplayLabel(lv.size) },
        unlocked,
        cleared,
        onSelect: () => this.sm.changeScreen("game", { levelSize: lv.size })
      });
      grid.appendChild(card);
    }

    panel.appendChild(grid);
    wrap.append(header, panel);

    container.innerHTML = "";
    container.appendChild(wrap);
    this._root = wrap;
  }

  unmount() {
    this._root = null;
  }
}
