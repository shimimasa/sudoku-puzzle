import { el } from "../ui/dom.js";
import { APP } from "../config.js";
import { HeaderBar, Panel, Button } from "../ui/components.js";

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

    const wrap = el("div", { className: "screen screen--menu" });
    const header = HeaderBar({ title: "タイトル" });
    const panel = Panel();

    const title = el("h1", { className: "title", text: APP.name });
    const sub = el("p", {
      className: "sub",
      text: "小さく始めて、少しずつレベルアップ。"
    });

    const btnStart = Button({
      text: "はじめる",
      variant: "primary",
      onClick: () => this.sm.changeScreen("levels")
    });

    const btnContinue = Button({
      text: "つづきから",
      variant: "secondary",
      onClick: () => {
        const last = state.progress.lastPlayed?.levelSize;
        if (!last) {
          this.sm.changeScreen("levels");
          return;
        }
        this.sm.changeScreen("game", { levelSize: last });
      }
    });

    const btnSettings = Button({
      text: "せってい",
      variant: "secondary",
      onClick: () => this.sm.changeScreen("settings", { backTo: "title" })
    });

    const footer = el("p", {
      className: "hint",
      text: "※ まずは「3マス」から。慣れたら次へ。"
    });

    panel.append(title, sub, btnStart, btnContinue, btnSettings, footer);
    wrap.append(header, panel);

    container.innerHTML = "";
    container.appendChild(wrap);
    this._root = wrap;
  }

  unmount() {
    // 追加のイベント解除が必要になったらここでやる
    this._root = null;
  }
}
