import { el } from "../ui/dom.js";
import { showToast } from "../ui/toast.js";
import { getPuzzle } from "../sudoku/puzzleLoader.js";
import { renderBoard } from "../sudoku/renderer.js";
import { renderNumberPad } from "../ui/NumberPad.js";
import { canPlace, isCleared, computeCandidates, findHint, applyHint } from "../sudoku/engine.js";
import { getDigitsForLevel } from "../sudoku/digits.js";
import {
  createLearningLog,
  finalizeLearningLog,
  appendLearningLog
} from "../state/learningLog.js";

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
        this._finalizeLog = null;
    
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

        const gameLayout = el("div", { className: "gameLayout" });
        const boardColumn = el("div", { className: "gameBoardColumn" });
        const padColumn = el("div", { className: "gamePadColumn" });

        boardColumn.append(status, board);
        gameLayout.append(boardColumn, padColumn);
        card.append(gameLayout);
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
            
                      // JSONが無い/ズレている場合でも必ず生成にフォールバックして「落ちない」
                      const loaded = await getPuzzle(levelSize, {
                        avoidId,
                        preferGenerated: !!settings.useGeneratedPuzzles,
                        difficulty: settings.difficulty || "normal"
                      });
                      puzzle = loaded.puzzle;
                      puzzleId = loaded.id;
                      const puzzleSource = loaded.source === "generated" ? "generated" : "pool";
    
          // 次回の重複回避のため保存（盤面実装後も引き続き使える）
          this.gs.setState({
            session: { lastPuzzleId: puzzleId }
          });
    
          status.textContent = "同じ数字は たて・よこ に入らないよ";

          const grid = puzzle.grid.map((row) => [...row]);
          const fixed = puzzle.grid.map((row) => row.map((v) => v !== 0));
          let selected = null;
          let hintUsedCount = 0;
          let hintSuggestUsed = false;
          let hintFillUsed = false;
          let hintCell = null; // { r, c, soft?: boolean } or null
          let hintSoftTimer = null;
          let errorCell = null; // { r, c } or null
          let errorTimer = null;
          let logFinalized = false;

          const logEntry = createLearningLog({
            levelSize,
            difficulty: settings.difficulty || "normal",
            source: puzzleSource,
            puzzleId,
            guideMode: settings.guideMode,
            pencilMode: settings.pencilMode
          });

          const finalizeLog = (result) => {
            if (logFinalized) return;
            logFinalized = true;
            const finalized = finalizeLearningLog(logEntry, { result });
            appendLearningLog(finalized);
          };

          this._finalizeLog = finalizeLog;

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

          const padWrap = el("div", { className: "gamePadWrap" });
    
          const actions = el("div", { className: "gameActions" });
          const helpBar = el("div", { className: "helpBar" });
          const helpMenu = el("div", { className: "helpMenu" });
          const helpToggle = el("button", {
            className: "btn helpToggle",
            text: "ヘルプ",
            attrs: {
              type: "button",
              "aria-expanded": "false"
            }
          });
          let helpOpen = false;
          const pencilToggle = el("button", {
            className: "helpItem",
            attrs: { type: "button" }
          });
          const hintSuggestBtn = el("button", {
            className: "helpItem",
            text: "ここを示す",
            attrs: { type: "button" }
          });
          const hintFillBtn = el("button", {
            className: "helpItem",
            text: "1マスだけ埋める",
            attrs: { type: "button" }
          });

          const setPencilMode = (next) => {
            this.gs.setState({
              settings: {
                pencilMode: next
              }
            });
            logEntry.pencilMode = next;
            redraw();
            updateHelpMenu();
          };

          const updateHelpMenu = () => {
            const { pencilMode } = this.gs.state.settings;
            pencilToggle.textContent = pencilMode ? "候補を表示：ON" : "候補を表示：OFF";
            pencilToggle.setAttribute("aria-pressed", pencilMode ? "true" : "false");
            hintSuggestBtn.toggleAttribute("disabled", hintSuggestUsed);
            hintFillBtn.toggleAttribute("disabled", hintFillUsed);
            hintSuggestBtn.textContent = hintSuggestUsed ? "ここを示す（使用済み）" : "ここを示す";
            hintFillBtn.textContent = hintFillUsed ? "1マスだけ埋める（使用済み）" : "1マスだけ埋める";
          };

          const toggleHelpMenu = () => {
            helpOpen = !helpOpen;
            helpMenu.classList.toggle("isOpen", helpOpen);
            helpToggle.setAttribute("aria-expanded", helpOpen ? "true" : "false");
          };

          helpToggle.addEventListener("click", toggleHelpMenu);
          pencilToggle.addEventListener("click", () => {
            const { pencilMode } = this.gs.state.settings;
            setPencilMode(!pencilMode);
          });
          const redraw = () => {
            const candidates = computeCandidates(grid, puzzle.numbers);
                      const { highlightSameNumber, pencilMode } = this.gs.state.settings;
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
                          showPencil: pencilMode,
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
                      const digits = getDigitsForLevel(levelSize);
                      const disabledSet = new Set();

                      if (!selected) {
                        // 選択してない時は全部押せない（誤操作防止）
                        digits.forEach((n) => disabledSet.add(n));
                        disabledSet.add(0);
                      } else if (guideMode) {
                        const { r, c } = selected;
                        for (const n of digits) {
                          if (!canPlace(grid, r, c, n)) disabledSet.add(n);
                        }
                        // けす は常に許可（ガイドでもOK）
                      }

                      padWrap.innerHTML = "";
                      padWrap.appendChild(
                        renderNumberPad(levelSize, onPadInput, { disabledSet })
                      );
                    };
                        
                                  const onPadInput = (value) => {
                                    if (!selected) return;
                                    const { r, c } = selected;
                                    const before = grid[r][c];
                        
                                    if (!canPlace(grid, r, c, value)) {
                                      logEntry.invalidAttempts += 1;
                                      showToast(wrap, "そこには入らないよ");
                                      flashError(r, c);
                                      return;
                                    }

                                    if (value === 0) {
                                      if (before !== 0) {
                                        logEntry.erasures += 1;
                                      }
                                    } else if (before !== value) {
                                      logEntry.moves += 1;
                                    }

                                    grid[r][c] = value;
                                    setHintCell(null); // 手動で触ったらヒント表示は消す
                                    redraw();
                                    updatePad();
                        
                                    if (isCleared(grid)) {
                                      showToast(wrap, "クリア！");
                                      finalizeLog("cleared");
                                      this.sm.changeScreen("result", { levelSize, cleared: true });
                                    }
                                  };

                                  const onSuggestHint = () => {
                                    if (hintSuggestUsed) return;
                                    const h = findHint(grid, puzzle.numbers);

                                    if (h.type === "none") {
                                      showToast(wrap, "ヒントが見つからないよ");
                                      return;
                                    }

                                    hintSuggestUsed = true;
                                    hintUsedCount += 1;
                                    logEntry.hintUsedCount = hintUsedCount;
                                    setHintCell({ r: h.r, c: h.c, soft: false });
                                    showToast(wrap, "ここが考えやすいよ");
                                    redraw();
                                    updateHelpMenu();
                                  };

                                  const onFillHint = () => {
                                    if (hintFillUsed) return;
                                    const result = applyHint(grid, puzzle.numbers);

                                    if (result.type === "none") {
                                      showToast(wrap, "ヒントが見つからないよ");
                                      return;
                                    }

                                    hintFillUsed = true;
                                    hintUsedCount += 1;
                                    logEntry.hintUsedCount = hintUsedCount;
                                    showToast(wrap, "1マスだけ埋めるよ");
                                    setHintCell({ r: result.r, c: result.c, soft: false });
                                    redraw();
                                    updatePad();
                                    updateHelpMenu();
                                    if (isCleared(grid)) {
                                      finalizeLog("cleared");
                                      this.sm.changeScreen("result", { levelSize, cleared: true });
                                    }
                                  };

                                  hintSuggestBtn.addEventListener("click", () => {
                                    onSuggestHint();
                                    if (helpOpen) toggleHelpMenu();
                                  });
                                  hintFillBtn.addEventListener("click", () => {
                                    onFillHint();
                                    if (helpOpen) toggleHelpMenu();
                                  });


                    redraw();
            
                    updatePad();
                    helpMenu.append(pencilToggle, hintSuggestBtn, hintFillBtn);
                    helpBar.append(helpToggle, helpMenu);
                    actions.appendChild(helpBar);
                    updateHelpMenu();
                    boardColumn.append(actions);
                    padColumn.append(padWrap);
        } catch (e) {
          const msg = e?.message || "エラー";
          status.textContent = `読み込みに失敗しました。(${msg})`;
          showToast(wrap, msg);
        }
      }
     
  unmount() {
    // 念のため（画面遷移後のタイマー発火でDOM触らないように）
    // ※ mount内スコープの timer はGC対象だが、保険として明示
    if (this._finalizeLog) {
      this._finalizeLog("abandoned");
      this._finalizeLog = null;
    }
    this._root = null;
  }
}
