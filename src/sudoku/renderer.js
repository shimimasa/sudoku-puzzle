import { el } from "../ui/dom.js";

export function renderBoard({ grid, fixed, candidates, hint, onSelect }) {
  const size = grid.length;

  const board = el("div", {
    className: "sudokuBoard",
    attrs: {
      style: `grid-template-columns: repeat(${size}, 1fr);`
    }
  });

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isFixed = fixed[r][c];
      const isHint = hint && hint.r === r && hint.c === c;
      const cell = el("button", {
        className: `sudokuCell ${isFixed ? "fixed" : ""} ${isHint ? "hint" : ""}`,
        text: grid[r][c] === 0 ? "" : String(grid[r][c]),
        on: {
          click: () => {
            if (!isFixed) onSelect(r, c);
          }
        }
      });
      // 鉛筆（候補）表示：空マスのみ
      if (grid[r][c] === 0 && candidates && candidates[r] && candidates[r][c]) {
          const cand = candidates[r][c];
          if (cand.length > 0) {
            cell.appendChild(
              el("span", {
                className: "pencil",
                text: cand.join(" ")
              })
            );
          }
        }
      board.appendChild(cell);
    }
  }

  return board;
}
