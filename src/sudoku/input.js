import { el } from "../ui/dom.js";

export function renderPad(numbers, onInput, { disabledSet = new Set() } = {}) {
  const pad = el("div", { className: "numberPad" });

  numbers.forEach((n) => {
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
