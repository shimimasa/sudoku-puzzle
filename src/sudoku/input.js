import { el } from "../ui/dom.js";

export function renderPad(numbers, onInput) {
  const pad = el("div", { className: "numberPad" });

  numbers.forEach((n) => {
    pad.appendChild(
      el("button", {
        className: "padBtn",
        text: String(n),
        on: { click: () => onInput(n) }
      })
    );
  });

  pad.appendChild(
    el("button", {
      className: "padBtn erase",
      text: "けす",
      on: { click: () => onInput(0) }
    })
  );

  return pad;
}
