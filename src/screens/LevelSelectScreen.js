import { el } from "../ui/dom.js";
import { LEVELS, isLevelUnlocked } from "../config.js";

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

    const wrap = el("div", { className: "screen" });
    const header = el("div", { className: "topbar" });
    const back = el("button", {
      className: "iconBtn",
      text: "← もどる",
      on: { click: () => this.sm.back("title") }
    });
    const title = el("div", { className: "topbarTitle", text: "レベルをえらぶ" });
    const settings = el("button", {
      className: "iconBtn",
      text: "せってい",
      on: { click: () => this.sm.changeScreen("settings", { backTo: "levels" }) }
    });
    header.append(back, title, settings);

    const card = el("div", { className: "card wide" });
    card.appendChild(el("p", { className: "sub", text: "できるところから、1つずつ。" }));

    const grid = el("div", { className: "levelGrid" });

    for (const lv of LEVELS) {
      const unlocked = isLevelUnlocked(progress, lv.size);
      const cleared = (progress.clearedLevels || []).includes(lv.size);

      const btn = el("button", {
        className: `levelBtn ${unlocked ? "" : "is-locked"}`,
        attrs: { "aria-disabled": unlocked ? "false" : "true" },
        on: {
          click: () => {
            if (!unlocked) return;
            this.sm.changeScreen("game", { levelSize: lv.size });
          }
        }
      });

      btn.appendChild(el("div", { className: "levelNum", text: String(lv.size) }));
      btn.appendChild(el("div", { className: "levelLabel", text: lv.label }));
      btn.appendChild(
        el("div", {
          className: "levelMeta",
          text: unlocked ? (cleared ? "クリア済み" : "プレイ") : "ロック中"
        })
      );

      grid.appendChild(btn);
    }

    card.appendChild(grid);
    wrap.append(header, card);

    container.innerHTML = "";
    container.appendChild(wrap);
    this._root = wrap;
  }

  unmount() {
    this._root = null;
  }
}
