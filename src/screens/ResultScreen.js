import { el } from "../ui/dom.js";

export class ResultScreen {
  constructor(screenManager, gameState, params = {}) {
    this.sm = screenManager;
    this.gs = gameState;
    this.params = params;
    this.name = "result";
    this._root = null;
  }

  mount(container) {
    const levelSize = Number(this.params.levelSize || 3);
    const cleared = Boolean(this.params.cleared);

    const wrap = el("div", { className: "screen" });
    const card = el("div", { className: "card" });

    const title = el("h2", {
      className: "title",
      text: cleared ? "クリア！" : "おつかれさま"
    });

    const sub = el("p", {
      className: "sub",
      text: cleared ? "できた。次もいける。" : "今日はここまででも大丈夫。"
    });

    if (cleared) {
      this.gs.markLevelCleared(levelSize);
    }
    this.gs.endSession();

    const toLevels = el("button", {
      className: "btn primary",
      text: "レベル選択へ",
      on: { click: () => this.sm.changeScreen("levels") }
    });

    const toTitle = el("button", {
      className: "btn",
      text: "タイトルへ",
      on: { click: () => this.sm.changeScreen("title") }
    });

    card.append(title, sub, toLevels, toTitle);
    wrap.appendChild(card);

    container.innerHTML = "";
    container.appendChild(wrap);
    this._root = wrap;
  }

  unmount() {
    this._root = null;
  }
}
