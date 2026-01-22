import { el } from "../ui/dom.js";

export class SettingsScreen {
  constructor(screenManager, gameState, params = {}) {
    this.sm = screenManager;
    this.gs = gameState;
    this.params = params;
    this.name = "settings";
    this._root = null;
  }

  mount(container) {
    const { settings } = this.gs.state;

    const wrap = el("div", { className: "screen" });
    const header = el("div", { className: "topbar" });

    const backTo = this.params.backTo || "title";
    const back = el("button", {
      className: "iconBtn",
      text: "← もどる",
      on: {
        click: () => this.sm.changeScreen(backTo, {}, { replace: true })
      }
    });

    const title = el("div", { className: "topbarTitle", text: "せってい" });
    header.append(back, title, el("div"));

    const card = el("div", { className: "card wide" });

    const row = (label, input) => {
      const r = el("div", { className: "row" });
      r.append(el("div", { className: "rowLabel", text: label }), input);
      return r;
    };

    const sfx = el("input", {
      attrs: { type: "checkbox" }
    });
    sfx.checked = !!settings.sfx;
    sfx.addEventListener("change", () => {
      this.gs.setState({ settings: { sfx: sfx.checked } });
    });

    const hl = el("input", { attrs: { type: "checkbox" } });
    hl.checked = !!settings.highlightSameNumber;
    hl.addEventListener("change", () => {
      this.gs.setState({ settings: { highlightSameNumber: hl.checked } });
    });

    const large = el("input", { attrs: { type: "checkbox" } });
    large.checked = !!settings.largeUI;
    large.addEventListener("change", () => {
      this.gs.setState({ settings: { largeUI: large.checked } });
      document.documentElement.dataset.largeUi = large.checked ? "1" : "0";
    });

    card.append(
      el("p", { className: "sub", text: "集中しやすい表示に整えます。" }),
      row("効果音", sfx),
      row("同じ数をハイライト（予定）", hl),
      row("文字を大きめにする", large),
      el("p", {
        className: "hint",
        text: "※ この画面はあとで拡張します（ヒント表示など）"
      })
    );

    wrap.append(header, card);

    container.innerHTML = "";
    container.appendChild(wrap);
    this._root = wrap;
  }

  unmount() {
    this._root = null;
  }
}
