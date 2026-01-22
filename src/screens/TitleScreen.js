import { el } from "../ui/dom.js";
import { APP } from "../config.js";

export class TitleScreen {
  constructor(screenManager, gameState, params = {}) {
    this.sm = screenManager;
    this.gs = gameState;
    this.params = params;
    this.name = "title";
    this._root = null;
  }

  mount(container) {
    const state = this.gs.state;

    const wrap = el("div", { className: "screen" });
    const card = el("div", { className: "card" });

    const title = el("h1", { className: "title", text: APP.name });
    const sub = el("p", {
      className: "sub",
      text: "小さく始めて、少しずつレベルアップ。"
    });

    const btnStart = el("button", {
      className: "btn primary",
      text: "はじめる",
      on: {
        click: () => this.sm.changeScreen("levels")
      }
    });

    const btnContinue = el("button", {
      className: "btn",
      text: "つづきから",
      on: {
        click: () => {
          const last = state.progress.lastPlayed?.levelSize;
          if (!last) {
            this.sm.changeScreen("levels");
            return;
          }
          this.sm.changeScreen("game", { levelSize: last });
        }
      }
    });

    const btnSettings = el("button", {
      className: "btn",
      text: "せってい",
      on: {
        click: () => this.sm.changeScreen("settings", { backTo: "title" })
      }
    });

    const footer = el("p", {
      className: "hint",
      text: "※ まずは「3マス」から。慣れたら次へ。"
    });

    card.append(title, sub, btnStart, btnContinue, btnSettings, footer);
    wrap.appendChild(card);

    container.innerHTML = "";
    container.appendChild(wrap);
    this._root = wrap;
  }

  unmount() {
    // 追加のイベント解除が必要になったらここでやる
    this._root = null;
  }
}
