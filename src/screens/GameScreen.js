import { el } from "../ui/dom.js";
import { showToast } from "../ui/toast.js";
import { loadRandomPuzzle } from "../sudoku/puzzleLoader.js";
import { renderBoard } from "../sudoku/renderer.js";
import { renderPad } from "../sudoku/input.js";
import { canPlace, isCleared } from "../sudoku/engine.js";

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
        const title = el("div", {
          className: "topbarTitle",
          text: `レベル ${levelSize}`
        });
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
    
        // ---- ランダム問題ロード（Phase1の下準備） ----
        try {
          const avoidId = this.gs.state.session.lastPuzzleId;
          const loaded = await loadRandomPuzzle(levelSize, { avoidId });
    
          // 次回の重複回避のため保存（盤面実装後も引き続き使える）
          this.gs.setState({
            session: { lastPuzzleId: loaded.id }
          });
    
          status.textContent = "同じ数字は たて・よこ に入らないよ";

          const grid = loaded.puzzle.grid.map((row) => [...row]);
          const fixed = loaded.puzzle.grid.map((row) => row.map((v) => v !== 0));
          let selected = null;
    
          const redraw = () => {
                      board.innerHTML = "";
                      board.appendChild(
                        renderBoard({
                          grid,
                          fixed,
                          onSelect: (r, c) => {
                            selected = { r, c };
                          }
                        })
                      );
                    };
            
                    redraw();
            
                    const pad = renderPad(loaded.puzzle.numbers, (value) => {
                      if (!selected) return;
                      const { r, c } = selected;
            
                      if (!canPlace(grid, r, c, value)) {
                        showToast(wrap, "そこには入らないよ");
                        return;
                      }
            
                      grid[r][c] = value;
                      redraw();
            
                      if (isCleared(grid)) {
                        showToast(wrap, "クリア！");
                        this.sm.changeScreen("result", { levelSize, cleared: true });
                      }
                    });
    
                    card.append(pad);
        } catch (e) {
          status.textContent = "読み込みに失敗しました。";
          showToast(wrap, e?.message || "エラー");
        }
      }
     
  unmount() {
    this._root = null;
  }
}
