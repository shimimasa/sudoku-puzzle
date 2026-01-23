import { el } from "../ui/dom.js";
import { HeaderBar, Panel, Button } from "../ui/components.js";

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

    const wrap = el("div", { className: "screen screen--menu" });
    const header = HeaderBar({ title: "リザルト" });
    const panel = Panel();

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

    const nextPuzzle = Button({
      text: "次の問題へ（同じレベル）",
      variant: "primary",
      onClick: () => this.sm.changeScreen("game", { levelSize })
    });

    const toLevels = Button({
      text: "レベル選択へ",
      variant: "secondary",
      onClick: () => this.sm.changeScreen("levels")
    });

    const toTitle = Button({
      text: "タイトルへ",
      variant: "secondary",
      onClick: () => this.sm.changeScreen("title")
    });

    panel.append(title, sub, nextPuzzle, toLevels, toTitle);
    wrap.append(header, panel);

    container.innerHTML = "";
    container.appendChild(wrap);
    this._root = wrap;
  }

  unmount() {
    this._root = null;
  }
}
