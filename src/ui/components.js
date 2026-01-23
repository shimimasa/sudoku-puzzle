import { el } from "./dom.js";

export function HeaderBar({
  title,
  onBack,
  onSettings,
  backLabel = "← もどる",
  settingsLabel = "せってい"
} = {}) {
  const header = el("div", { className: "headerBar" });

  const left = onBack
    ? el("button", {
        className: "headerBar__button",
        text: backLabel,
        attrs: { type: "button" },
        on: { click: onBack }
      })
    : el("div", { className: "headerBar__spacer" });

  const center = el("div", { className: "headerBar__title", text: title || "" });

  const right = onSettings
    ? el("button", {
        className: "headerBar__button",
        text: settingsLabel,
        attrs: { type: "button" },
        on: { click: onSettings }
      })
    : el("div", { className: "headerBar__spacer" });

  header.append(left, center, right);
  return header;
}

export function Panel({ wide = false } = {}) {
  return el("div", { className: `panel${wide ? " panel--wide" : ""}` });
}

export function Button({ text, variant = "secondary", onClick, type = "button" }) {
  const variantClass = variant ? `btn--${variant}` : "";
  return el("button", {
    className: `btn ${variantClass}`.trim(),
    text,
    attrs: { type },
    on: onClick ? { click: onClick } : undefined
  });
}

export function SettingRow({ label, description, badge, control, clickable = false }) {
  const rowTag = clickable ? "label" : "div";
  const row = el(rowTag, { className: `settingRow${clickable ? " is-clickable" : ""}` });

  const textWrap = el("div", { className: "settingRow__text" });
  const title = el("div", { className: "settingRow__title", text: label });
  if (badge) {
    title.appendChild(el("span", { className: "settingRow__badge", text: badge }));
  }
  textWrap.appendChild(title);

  if (description) {
    textWrap.appendChild(el("div", { className: "settingRow__desc", text: description }));
  }

  const controlWrap = el("div", { className: "settingRow__control" });
  if (control) controlWrap.appendChild(control);

  row.append(textWrap, controlWrap);
  return row;
}

export function SwitchControl(input) {
  const wrap = el("div", { className: "switchControl" });
  wrap.append(input, el("span", { className: "switchControl__track" }));
  return wrap;
}

export function LevelCard({ level, unlocked, cleared, onSelect }) {
  const status = unlocked ? (cleared ? "CLEAR" : "PLAY") : "LOCK";
  const labelMatch = level.label.match(/^(.*)（(.*)）$/);
  const name = labelMatch ? labelMatch[1] : level.label;
  const range = labelMatch ? labelMatch[2] : "";

  const card = el("button", {
    className: `levelCard${unlocked ? "" : " is-locked"}`,
    attrs: {
      type: "button",
      "aria-disabled": unlocked ? "false" : "true",
      ...(unlocked ? {} : { disabled: "true" })
    },
    on: {
      click: () => {
        if (!unlocked) return;
        onSelect?.();
      }
    }
  });

  const header = el("div", { className: "levelCard__header" });
  header.append(
    el("div", { className: "levelCard__number", text: String(level.size) }),
    el("span", {
      className: `levelCard__status levelCard__status--${status.toLowerCase()}`,
      text: status
    })
  );

  const body = el("div", { className: "levelCard__body" });
  body.append(
    el("div", { className: "levelCard__name", text: name }),
    el("div", { className: "levelCard__range", text: range || " " })
  );

  card.append(header, body);
  return card;
}
