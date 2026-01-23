import { el } from "../ui/dom.js";

function miniGridCols(size) {
  // 3x3(Lv3)は 3列が読みやすい。4x4は2列、9x9は3列を期待。
  if (size === 3) return 3;
  return Math.ceil(Math.sqrt(size)); // 4->2, 5..9->3
}

function keyOf(r, c) {
  return `${r},${c}`;
}

export function renderBoard({
  grid,
  fixed,
  numbers,
  candidates,
  showPencil = true,
  selected,
  highlightSet,
  hint,
  error,
  onSelect
}) {
  const size = grid.length;
  const cols = miniGridCols(size);

  const board = el("div", {
    className: "sudokuBoard",
    attrs: {
      style: `--n:${size};--mini:${cols};`
    }
  });

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isFixed = fixed[r][c];
      const isHint = hint && hint.r === r && hint.c === c;
      const isHintSoft = !!(isHint && hint.soft);
      const isSelected = !!(selected && selected.r === r && selected.c === c);
      const isSame = !!(highlightSet && highlightSet.has(keyOf(r, c)));
      const isError = !!(error && error.r === r && error.c === c);
      const value = grid[r][c];
      const cell = el("button", {
        className: `sudokuCell ${isFixed ? "fixed" : "editable"} ${isHint ? "hint" : ""} ${
          isHintSoft ? "hintSoft" : ""
        } ${isSelected ? "isSelected" : ""} ${isSame ? "isSame" : ""} ${isError ? "isError" : ""}`,
        attrs: {
          type: "button",
          ...(isSelected ? { "aria-current": "true" } : {})
        },
        on: {
          click: () => {
            onSelect(r, c, isFixed);
          }
        }
      });

      // 値（中央）を明示的にDOMで分離（鉛筆と衝突しないようにする）
      if (value !== 0) {
        cell.appendChild(
          el("span", {
            className: "cellValue",
            text: String(value)
          })
        );
      }
      // 鉛筆（候補）表示：空マスのみ
      if (showPencil && value === 0 && candidates && candidates[r] && candidates[r][c]) {
        const cand = candidates[r][c];
        if (cand.length > 0) {
          const set = new Set(cand);
          const pencil = el("span", { className: "pencilGrid" });

          // numbers の順番で並べる（空きは空表示）→ 4x4でも9x9でも崩れにくい
          // numbers が渡らない場合でも落ちないように保険
          const seq = numbers && numbers.length ? numbers : Array.from({ length: size }, (_, i) => i + 1);
          for (const n of seq) {
            pencil.appendChild(
              el("span", {
                className: `pencilItem ${set.has(n) ? "isOn" : "isOff"}`,
                text: set.has(n) ? String(n) : ""
              })
            );
          }
          cell.appendChild(pencil);
        }
      }
      board.appendChild(cell);
    }
  }

  return board;
}
