import { el } from "../ui/dom.js";
import { showToast } from "../ui/toast.js";
import { loadRandomPuzzle } from "../sudoku/puzzleLoader.js";
import { renderBoard } from "../sudoku/renderer.js";
import { renderPad } from "../sudoku/input.js";
import { canPlace, isCleared, computeCandidates, findHint } from "../sudoku/engine.js";
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
          let hintUsed = false;
          let hintCell = null; // { r, c, soft?: boolean } or null
          let hintSoftTimer = null;
          let errorCell = null; // { r, c } or null
          let errorTimer = null;

          const setHintCell = (cell) => {
            hintCell = cell;
            if (hintSoftTimer) clearTimeout(hintSoftTimer);
            if (cell) {
              // 一定時間後に“強調”を弱める（次の操作でも解除）
              hintSoftTimer = setTimeout(() => {
                if (hintCell && hintCell.r === cell.r && hintCell.c === cell.c) {
                  hintCell = { ...hintCell, soft: true };
                  redraw();
                }
              }, 2200);
            }
          };

          const flashError = (r, c) => {
            errorCell = { r, c };
            if (errorTimer) clearTimeout(errorTimer);
            errorTimer = setTimeout(() => {
              errorCell = null;
              redraw();
            }, 520);
            redraw();
          };

          const padWrap = el("div");
    
          const actions = el("div", { className: "gameActions" });
          const hintBtn = el("button", {
            className: "btn",
            text: "ヒント（1回）",
            on: { click: () => onHint() }
          });
          const redraw = () => {
            const candidates = computeCandidates(grid, puzzle.numbers);
            const { highlightSameNumber } = this.gs.state.settings;
            const highlightSet = new Set();
            if (highlightSameNumber && selected) {
              const v = grid[selected.r][selected.c];
              if (v && v !== 0) {
                for (let rr = 0; rr < grid.length; rr++) {
                  for (let cc = 0; cc < grid.length; cc++) {
                    if (grid[rr][cc] === v) highlightSet.add(`${rr},${cc}`);
                  }
                }
              }
            }

                      board.innerHTML = "";
                      board.appendChild(
                        renderBoard({
                          grid,
                          fixed,
                          numbers: puzzle.numbers,
                          candidates,
                          selected,
                          highlightSet,
                          hint: hintCell,
                          error: errorCell,
                          onSelect: (r, c) => {
                            selected = { r, c };
                            setHintCell(null); // 手動で触ったらヒント表示は消す
                            updatePad(); // 選択が変わったら候補更新
                            redraw(); // 選択表示/同値ハイライト更新
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
                                      flashError(r, c);
                                      return;
                                    }
                        
                                    grid[r][c] = value;
                                    setHintCell(null); // 手動で触ったらヒント表示は消す
                                    redraw();
                                    updatePad();
                        
                                    if (isCleared(grid)) {
                                      showToast(wrap, "クリア！");
                                      this.sm.changeScreen("result", { levelSize, cleared: true });
                                    }
                                  };

                                  const onHint = () => {
                                                if (hintUsed) return;
                                                const h = findHint(grid, puzzle.numbers);
                                    
                                               if (h.type === "none") {
                                                  showToast(wrap, "ヒントが見つからないよ");
                                                  return;
                                                }
                                    
                                                hintUsed = true;
                                                hintBtn.setAttribute("disabled", "true");
                                    
                                                if (h.type === "single") {
                                                  // 1手だけ埋める（“埋めやすい場所”の具体例として最強）
                                                  grid[h.r][h.c] = h.value;
                                                  showToast(wrap, "ここは1つに決まるよ");
                                                  setHintCell({ r: h.r, c: h.c, soft: false });
                                                  redraw();
                                                  updatePad();
                                                  if (isCleared(grid)) {
                                                    this.sm.changeScreen("result", { levelSize, cleared: true });
                                                  }
                                                  return;
                                                }
                                    
                                                // 候補最小のマスを示す（埋めはしない）
                                                setHintCell({ r: h.r, c: h.c, soft: false });
                                                showToast(wrap, "ここが考えやすいよ");
                                                redraw();
                                              };


                    redraw();
            
                    updatePad();
                    actions.appendChild(hintBtn);
                    card.append(actions, padWrap);
        } catch (e) {
          status.textContent = "読み込みに失敗しました。";
          showToast(wrap, e?.message || "エラー");
        }
      }
     
  unmount() {
    // 念のため（画面遷移後のタイマー発火でDOM触らないように）
    // ※ mount内スコープの timer はGC対象だが、保険として明示
    this._root = null;
  }
}
