import { el } from "../ui/dom.js";

export function renderBoard({ grid, fixed, onSelect }) {
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
      const cell = el("button", {
        className: `sudokuCell ${isFixed ? "fixed" : ""}`,
        text: grid[r][c] === 0 ? "" : String(grid[r][c]),
        on: {
          click: () => {
            if (!isFixed) onSelect(r, c);
          }
        }
      });
      board.appendChild(cell);
    }
  }

  return board;
}
