import { el } from "../ui/dom.js";
import { showToast } from "../ui/toast.js";

export class GameScreen {
  constructor(screenManager, gameState, params = {}) {
    this.sm = screenManager;
    this.gs = gameState;
    this.params = params;
    this.name = "game";
    this._root = null;
  }

  mount(container) {
    const levelSize = Number(this.params.levelSize || 3);
    this.gs.startSession(levelSize);

    const wrap = el("div", { className: "screen" });

    const header = el("div", { className: "topbar" });
    const home = el("button", {
      className: "iconBtn",
      text: "🏠 ホーム",
      on: { click: () => this.sm.changeScreen("title") }
    });
    const pause = el("button", {
      className: "iconBtn",
      text: "⏸ いったん停止",
      on: { click: () => this.sm.changeScreen("pause", { from: "game", levelSize }) }
    });
    const title = el("div", {
      className: "topbarTitle",
      text: `レベル ${levelSize}`
    });
    header.append(home, title, pause);

    const card = el("div", { className: "card wide" });
    card.append(
      el("p", { className: "sub", text: "※ いまは画面遷移の確認用です（数独は次で実装）。" })
    );

    const board = el("div", { className: "boardPlaceholder" });
    board.appendChild(el("div", { className: "boardPlaceholderInner", text: "ここに盤面が入ります" }));

    const btnClear = el("button", {
      className: "btn primary",
      text: "（デモ）クリアにする",
      on: {
        click: () => {
          showToast(wrap, "クリア！");
          this.sm.changeScreen("result", { levelSize, cleared: true });
        }
      }
    });

    const btnFail = el("button", {
      className: "btn",
      text: "（デモ）レベル選択へ戻る",
      on: {
        click: () => {
          this.gs.endSession();
          this.sm.changeScreen("levels");
        }
      }
    });

    card.append(board, btnClear, btnFail);
    wrap.append(header, card);

    container.innerHTML = "";
    container.appendChild(wrap);
    this._root = wrap;
  }

  unmount() {
    this._root = null;
  }
}
