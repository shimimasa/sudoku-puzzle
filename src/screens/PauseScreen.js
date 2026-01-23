import { el } from "../ui/dom.js";

export class PauseScreen {
  constructor(screenManager, gameState, params = {}) {
    this.sm = screenManager;
    this.gs = gameState;
    this.params = params;
    this.name = "pause";
    this._root = null;
  }

  mount(container) {
    const levelSize = Number(this.params.levelSize || this.gs.state.session.currentLevelSize || 3);

    const wrap = el("div", { className: "screen" });
    const card = el("div", { className: "card" });

    card.append(
      el("h2", { className: "title", text: "いったん停止" }),
      el("p", { className: "sub", text: "ムリせず、休みながら進めよう。" })
    );

    const resume = el("button", {
      className: "btn primary",
      text: "つづける",
      on: { click: () => this.sm.changeScreen("game", { levelSize, resume: true }, { replace: true }) }
    });

    const toLevels = el("button", {
      className: "btn",
      text: "レベル選択へ",
      on: () => {
        this.gs.endSession();
        this.sm.changeScreen("levels");
      }
    });

    const settings = el("button", {
      className: "btn",
      text: "せってい",
      on: { click: () => this.sm.changeScreen("settings", { backTo: "pause" }) }
    });

    card.append(resume, toLevels, settings);
    wrap.appendChild(card);

    container.innerHTML = "";
    container.appendChild(wrap);
    this._root = wrap;
  }

  unmount() {
    this._root = null;
  }
}
