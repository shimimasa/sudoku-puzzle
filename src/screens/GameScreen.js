import { el } from "../ui/dom.js";
import { showToast } from "../ui/toast.js";
import { loadRandomPuzzle } from "../sudoku/puzzleLoader.js";

export class GameScreen {
  constructor(screenManager, gameState, params = {}) {
    this.sm = screenManager;
    this.gs = gameState;
    this.params = params;
    this.name = "game";
    this._root = null;
    this._abort = null;
  }

  async mount(container) {
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
    const title = el("div", { className: "topbarTitle", text: `レベル ${levelSize}` });
    header.append(home, title, pause);

    const card = el("div", { className: "card wide" });
    const status = el("p", { className: "sub", text: "問題をよみこみ中…" });

    const board = el("div", { className: "boardPlaceholder" });
    board.appendChild(el("div", { className: "boardPlaceholderInner", text: "Loading..." }));

    card.append(status, board);
    wrap.append(header, card);

    container.innerHTML = "";
    container.appendChild(wrap);
    this._root = wrap;

    // ---- ランダム問題ロード ----
    try {
      const avoidId = this.gs.state.session.lastPuzzleId;
      const loaded = await loadRandomPuzzle(levelSize, { avoidId });

      // セッションに「今回の問題ID」を保存（次回の重複回避用）
      this.gs.setState({
        session: { lastPuzzleId: loaded.id }
      });

      status.textContent = `問題: ${loaded.id}`;

      // ここで次フェーズの盤面レンダリングに接続する
      // いったん確認用に中身を表示
      board.innerHTML = "";
      board.appendChild(
        el("pre", {
          className: "jsonPreview",
          text: JSON.stringify(loaded.puzzle, null, 2)
        })
      );

      // デモ：いまは「クリア」ボタンを置いて遷移確認
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
      card.appendChild(btnClear);
    } catch (e) {
      status.textContent = "読み込みに失敗しました。";
      showToast(wrap, e?.message || "エラー");
    }
  }

  unmount() {
    this._root = null;
  }
}
