import { el } from "../ui/dom.js";
import { showToast } from "../ui/toast.js";
import { getPuzzle } from "../sudoku/puzzleLoader.js";
import { renderBoard } from "../sudoku/renderer.js";
import { renderNumberPad } from "../ui/NumberPad.js";
import { canPlace, isCleared, computeCandidates, findHint, applyHint } from "../sudoku/engine.js";
import { getDigitsForLevel } from "../sudoku/digits.js";
import { getLevelDisplayLabel } from "../config.js";
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
    this._timeouts = new Set();
    this._active = false;
    this._mountToken = 0;
  }

  async mount(container) {
        this._active = true;
        const token = ++this._mountToken;
        const schedule = (fn, ms) => {
          const id = setTimeout(() => {
            this._timeouts.delete(id);
            fn();
          }, ms);
          this._timeouts.add(id);
          return id;
        };
        const isActive = () => this._active && this._mountToken === token && this.sm.current === this;

        const levelSize = Number(this.params.levelSize || 3);
        this.gs.startSession(levelSize);
        this._finalizeLog = null;
        const reduceMotion = typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const motionDelay = (ms, reducedMs = 0) => (reduceMotion ? reducedMs : ms);
    
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
          text: getLevelDisplayLabel(levelSize)
        });
        header.append(home, title, pause);
    
        const card = el("div", { className: "card wide" });
        const status = el("p", { className: "sub", text: "問題をよみこみ中…" });

        const board = el("div", { className: "boardPlaceholder" });
        board.appendChild(el("div", { className: "boardPlaceholderInner", text: "よみこみ中…" }));

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
            const { session } = this.gs.state;
            
                      let puzzle;
                      let puzzleId;
                      let puzzleSource = "pool";
                      const canResume =
                        !!this.params.resume &&
                        session.inProgress &&
                        session.currentLevelSize === levelSize &&
                        Array.isArray(session.grid) &&
                        Array.isArray(session.fixed) &&
                        Array.isArray(session.puzzleNumbers);

                      if (canResume) {
                        puzzle = {
                          grid: session.fixed,
                          numbers: session.puzzleNumbers
                        };
                        puzzleId = session.puzzleId || avoidId;
                        puzzleSource = session.source || "pool";
                      } else {
                        // JSONが無い/ズレている場合でも必ず生成にフォールバックして「落ちない」
                        const loaded = await getPuzzle(levelSize, {
                          avoidId,
                          preferGenerated: !!settings.useGeneratedPuzzles,
                          difficulty: settings.difficulty || "normal"
                        });
                        puzzle = loaded.puzzle;
                        puzzleId = loaded.id;
                        puzzleSource = loaded.source === "generated" ? "generated" : "pool";
                      }
    
          // 次回の重複回避のため保存（盤面実装後も引き続き使える）
          this.gs.setState({
            session: { lastPuzzleId: puzzleId }
          });
    
          status.textContent = "同じ数字は たて・よこ に入らないよ";

          const grid = canResume
            ? session.grid.map((row) => [...row])
            : puzzle.grid.map((row) => [...row]);
          let fixed = [];
          if (canResume) {
            fixed = session.fixed.map((row) => [...row]);
          } else {
            fixed = puzzle.grid.map((row) => row.map((v) => v !== 0));
          }
          const findFirstEmpty = () => {
            for (let r = 0; r < grid.length; r++) {
              for (let c = 0; c < grid.length; c++) {
                if (!fixed[r][c] && grid[r][c] === 0) return { r, c };
              }
            }
            return null;
          };
          let selected = canResume ? session.selected || findFirstEmpty() : findFirstEmpty();
          let hintUsedCount = canResume ? session.hintUsedCount || 0 : 0;
          let hintSuggestUsed = canResume ? !!session.hintSuggestUsed : false;
          let hintFillUsed = canResume ? !!session.hintFillUsed : false;
          let hintCell = null; // { r, c, soft?: boolean } or null
          let hintSoftTimer = null;
          let errorCell = null; // { r, c } or null
          let errorTimer = null;
          let lastInvalidAt = 0;
          let lastFixedInputAt = 0;
          let logFinalized = false;
          let hasCelebratedClear = false;
          let clearTransitioned = false;
          let clearSparkleTimer = null;

          const logEntry = createLearningLog({
            levelSize,
            difficulty: settings.difficulty || "normal",
            source: puzzleSource,
            puzzleId,
            guideMode: settings.guideMode,
            pencilMode: settings.pencilMode
          });
          const mistakeCounts = new Map();
          const helpUsedCounts = { ...logEntry.helpUsedCounts };
          logEntry.helpUsedCounts = helpUsedCounts;
          logEntry.resumeCount = this.params.resume && canResume ? 1 : 0;

          const markFirstAction = () => {
            if (logEntry.firstActionDelaySec == null) {
              logEntry.firstActionDelaySec = Math.max(
                0,
                Math.round((Date.now() - logEntry.tsStart) / 1000)
              );
            }
          };

          const buildMistakeCells = () => {
            if (!mistakeCounts.size) return {};
            const sorted = Array.from(mistakeCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5);
            const result = {};
            for (const [key, count] of sorted) {
              result[key] = count;
            }
            return result;
          };

          const finalizeLog = (result) => {
            if (logFinalized) return;
            logFinalized = true;
            if (logEntry.firstActionDelaySec == null) {
              logEntry.firstActionDelaySec = 0;
            }
            logEntry.mistakeCells = buildMistakeCells();
            const finalized = finalizeLearningLog(logEntry, { result });
            appendLearningLog(finalized);
          };

          this._finalizeLog = finalizeLog;

          const persistSession = () => {
            const snapshotGrid = grid.map((row) => [...row]);
            const snapshotFixed = fixed.map((row) => [...row]);
            this.gs.setState({
              session: {
                currentLevelSize: levelSize,
                inProgress: true,
                lastPuzzleId: puzzleId || avoidId,
                puzzleId: puzzleId || avoidId,
                puzzleNumbers: puzzle.numbers,
                grid: snapshotGrid,
                fixed: snapshotFixed,
                selected,
                source: puzzleSource,
                difficulty: settings.difficulty || "normal",
                hintUsedCount,
                hintSuggestUsed,
                hintFillUsed
              }
            });
          };

          const setHintCell = (cell) => {
            hintCell = cell;
            if (hintSoftTimer) clearTimeout(hintSoftTimer);
            if (cell) {
              // 一定時間後に“強調”を弱める（次の操作でも解除）
              hintSoftTimer = schedule(() => {
                if (!isActive()) return;
                if (hintCell && hintCell.r === cell.r && hintCell.c === cell.c) {
                  hintCell = { ...hintCell, soft: true };
                  redraw();
                }
              }, motionDelay(2200, 100));
            }
          };

          if (!canResume) {
            persistSession();
          }

          const flashError = (r, c) => {
            errorCell = { r, c };
            if (errorTimer) clearTimeout(errorTimer);
            errorTimer = schedule(() => {
              if (!isActive()) return;
              errorCell = null;
              redraw();
            }, motionDelay(360, 80));
            redraw();
          };

          const padWrap = el("div", { className: "gamePadWrap" });
          const clearSparkles = el("div", { className: "clearSparkles", attrs: { "aria-hidden": "true" } });
          for (let i = 0; i < 6; i++) {
            clearSparkles.appendChild(el("span", { className: "clearSparkle", text: "✦" }));
          }

          const celebrateClear = () => {
            if (hasCelebratedClear) return;
            hasCelebratedClear = true;
            clearSparkles.classList.add("isActive");
            boardColumn.appendChild(clearSparkles);
            if (clearSparkleTimer) clearTimeout(clearSparkleTimer);
            clearSparkleTimer = schedule(() => {
              if (!isActive()) return;
              clearSparkles.classList.remove("isActive");
              clearSparkles.remove();
            }, motionDelay(1200, 100));
          };

          const handleClear = () => {
            if (clearTransitioned) return;
            clearTransitioned = true;
            showToast(wrap, "やったね！");
            celebrateClear();
            finalizeLog("cleared");
            schedule(() => {
              if (!isActive()) return;
              this.sm.changeScreen("result", { levelSize, cleared: true });
            }, motionDelay(260, 50));
          };
    
          const actions = el("div", { className: "gameActions" });
          const helpBar = el("div", { className: "helpBar" });
          const helpMenuId = "help-menu";
          const helpMenu = el("div", { className: "helpMenu", attrs: { id: helpMenuId } });
          const helpToggle = el("button", {
            className: "btn helpToggle helpTogglePrimary",
            text: "たすけて",
            attrs: {
              type: "button",
              "aria-controls": helpMenuId,
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
            markFirstAction();
            this.gs.setState({
              settings: {
                pencilMode: next
              }
            });
            logEntry.pencilMode = next;
            if (next) {
              helpUsedCounts.narrow += 1;
            }
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

          const setHelpMenuOpen = (next) => {
            helpOpen = next;
            helpMenu.classList.toggle("isOpen", helpOpen);
            helpToggle.setAttribute("aria-expanded", helpOpen ? "true" : "false");
          };

          const toggleHelpMenu = () => {
            setHelpMenuOpen(!helpOpen);
          };

          helpToggle.addEventListener("click", toggleHelpMenu);
          this._abort = new AbortController();
          document.addEventListener(
            "keydown",
            (event) => {
              if (event.key !== "Escape" || !helpOpen) return;
              setHelpMenuOpen(false);
            },
            { signal: this._abort.signal }
          );
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
                            persistSession();
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
                        renderNumberPad(levelSize, onPadInput, {
                          disabledSet,
                          showGuide: !selected
                        })
                      );
                    };
                        
                                  const onPadInput = (value) => {
                                    if (!selected) {
                                      showToast(wrap, "マスをえらんでね");
                                      return;
                                    }
                                    const { r, c } = selected;
                                    const before = grid[r][c];

                                  if (fixed[r][c]) {
                                      const now = Date.now();
                                      if (now - lastFixedInputAt < 500) return;
                                      lastFixedInputAt = now;
                                      showToast(wrap, "ここはそのままでOK");
                                      return;
                                    }
                        
                                    markFirstAction();
                                    if (!canPlace(grid, r, c, value)) {
                                      const now = Date.now();
                                      logEntry.invalidAttempts += 1;
                                      const key = `${r},${c}`;
                                      mistakeCounts.set(key, (mistakeCounts.get(key) || 0) + 1);
                                      if (now - lastInvalidAt < 500) return;
                                      lastInvalidAt = now;
                                      showToast(wrap, "べつのマスからね");
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
                                    persistSession();
                        
                                    if (isCleared(grid)) {
                                      handleClear();
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
                                    helpUsedCounts.look += 1;
                                    setHintCell({ r: h.r, c: h.c, soft: false });
                                    showToast(wrap, "ここが考えやすいよ");
                                    redraw();
                                    updateHelpMenu();
                                    persistSession();
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
                                    helpUsedCounts.fill += 1;
                                    showToast(wrap, "1マスだけ埋めるよ");
                                    setHintCell({ r: result.r, c: result.c, soft: false });
                                    redraw();
                                    updatePad();
                                    updateHelpMenu();
                                    persistSession();
                                    if (isCleared(grid)) {
                                      handleClear();
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
    this._active = false;
    for (const id of this._timeouts) {
      clearTimeout(id);
    }
    this._timeouts.clear();
    // 念のため（画面遷移後のタイマー発火でDOM触らないように）
    // ※ mount内スコープの timer はGC対象だが、保険として明示
    if (this._finalizeLog) {
      this._finalizeLog("abandoned");
      this._finalizeLog = null;
    }
    if (this._abort) {
      this._abort.abort();
      this._abort = null;
    }
    this._root = null;
  }
}
