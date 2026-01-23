import { el } from "./dom.js";
import { getDigitsForLevel } from "../sudoku/digits.js";

export function renderNumberPad(level, onInput, { disabledSet = new Set(), columns = 3 } = {}) {
  const digits = getDigitsForLevel(level);
  const pad = el("div", { className: "numberPad" });

  pad.style.setProperty("--pad-cols", String(columns));

  digits.forEach((n) => {
    pad.appendChild(
      el("button", {
        className: "padBtn",
        text: String(n),
        attrs: disabledSet.has(n) ? { disabled: "true" } : {},
        on: { click: () => onInput(n) }
      })
    );
  });

  pad.appendChild(
    el("button", {
      className: "padBtn erase",
      text: "けす",
      attrs: disabledSet.has(0) ? { disabled: "true" } : {},
      on: { click: () => onInput(0) }
    })
  );

  return pad;
}
