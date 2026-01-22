import { el } from "../ui/dom.js";
import { showToast } from "../ui/toast.js";
import { loadRandomPuzzle } from "../sudoku/puzzleLoader.js";
import { renderBoard } from "../sudoku/renderer.js";
import { renderPad } from "../sudoku/input.js";
import { canPlace, isCleared } from "../sudoku/engine.js";
import { generateSolution, makePuzzleFromSolution } from "../sudoku/generator.js";

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
                      const { settings } = this.gs.state;
            
                      let puzzle;
                      let puzzleId;
            
                      if (settings.useGeneratedPuzzles) {
                        const sol = generateSolution(levelSize);
                        // レベルが上がるほど “穴” を少し増やす（簡易）
                        const ratio = Math.max(0.32, 0.52 - (levelSize - 3) * 0.03);
                        puzzle = makePuzzleFromSolution(sol, ratio);
                        puzzleId = `gen:${levelSize}:${Date.now()}`;
                      } else {
                        const loaded = await loadRandomPuzzle(levelSize, { avoidId });
                        puzzle = loaded.puzzle;
                        puzzleId = loaded.id;
                      }
    
          // 次回の重複回避のため保存（盤面実装後も引き続き使える）
          this.gs.setState({
            session: { lastPuzzleId: puzzleId }
          });
    
          status.textContent = "同じ数字は たて・よこ に入らないよ";

          const grid = puzzle.grid.map((row) => [...row]);
          const fixed = puzzle.grid.map((row) => row.map((v) => v !== 0));
          let selected = null;

          const padWrap = el("div");
    
          const redraw = () => {
                      board.innerHTML = "";
                      board.appendChild(
                        renderBoard({
                          grid,
                          fixed,
                          onSelect: (r, c) => {
                            selected = { r, c };
                            updatePad(); // 選択が変わったら候補更新
                          }
                        })
                      );
                    };
            

                    const updatePad = () => {
                                    const { guideMode } = this.gs.state.settings;
                                    const disabledSet = new Set();
                                    if (guideMode) {
                                      if (!selected) {
                                    // 選択してない時は全部押せない（誤操作防止）
                                        puzzle.numbers.forEach((n) => disabledSet.add(n));
                                        disabledSet.add(0);
                                      } else {
                                        const { r, c } = selected;
                                        for (const n of puzzle.numbers) {
                                          if (!canPlace(grid, r, c, n)) disabledSet.add(n);
                                        }
                                        // けす は常に許可（ガイドでもOK）
                                      }
                                    }
                                    padWrap.innerHTML = "";
                                    padWrap.appendChild(
                                      renderPad(puzzle.numbers, onPadInput, { disabledSet })
                                    );
                                  };
                        
                                  const onPadInput = (value) => {
                                    if (!selected) return;
                                    const { r, c } = selected;
                        
                                    if (!canPlace(grid, r, c, value)) {
                                      showToast(wrap, "そこには入らないよ");
                                      return;
                                    }
                        
                                    grid[r][c] = value;
                                    redraw();
                                    updatePad();
                        
                                    if (isCleared(grid)) {
                                      showToast(wrap, "クリア！");
                                      this.sm.changeScreen("result", { levelSize, cleared: true });
                                    }
                                  };


                    redraw();
            
                    updatePad();
          card.append(padWrap);
        } catch (e) {
          status.textContent = "読み込みに失敗しました。";
          showToast(wrap, e?.message || "エラー");
        }
      }
     
  unmount() {
    this._root = null;
  }
}
