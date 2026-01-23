import { el } from "../ui/dom.js";
import { DIFFICULTY_LABELS } from "../config.js";
import { HeaderBar, Panel, SettingRow, SwitchControl } from "../ui/components.js";

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

    const wrap = el("div", { className: "screen screen--menu" });

    const backTo = this.params.backTo || "title";
    const header = HeaderBar({
      title: "せってい",
      onBack: () => this.sm.changeScreen(backTo, {}, { replace: true })
    });

    const panel = Panel({ wide: true });

    const parseLabel = (text) => {
      const match = text.match(/^(.*)（(予定|試験運用)）$/);
      if (!match) return { label: text, badge: null };
      return { label: match[1], badge: match[2] };
    };

    const buildToggleRow = (labelText, description, input) => {
      const { label, badge } = parseLabel(labelText);
      return SettingRow({
        label,
        description,
        badge,
        clickable: true,
        control: SwitchControl(input)
      });
    };

    const bgm = el("input", {
      className: "switchControl__input",
      attrs: { type: "checkbox" }
    });
    bgm.checked = !!settings.bgmEnabled;
    bgm.addEventListener("change", () => {
      this.gs.setState({ settings: { bgmEnabled: bgm.checked } });
    });

    const sfx = el("input", {
      className: "switchControl__input",
      attrs: { type: "checkbox" }
    });
    sfx.checked = settings.sfxEnabled ?? settings.sfx ?? true;
    sfx.addEventListener("change", () => {
      this.gs.setState({ settings: { sfxEnabled: sfx.checked } });
    });

    const hl = el("input", {
      className: "switchControl__input",
      attrs: { type: "checkbox" }
    });
    hl.checked = !!settings.highlightSameNumber;
    hl.addEventListener("change", () => {
      this.gs.setState({ settings: { highlightSameNumber: hl.checked } });
    });

    const large = el("input", {
      className: "switchControl__input",
      attrs: { type: "checkbox" }
    });
    large.checked = !!settings.largeUI;
    large.addEventListener("change", () => {
      this.gs.setState({ settings: { largeUI: large.checked } });
      document.documentElement.dataset.largeUi = large.checked ? "1" : "0";
    });

    const guide = el("input", {
      className: "switchControl__input",
      attrs: { type: "checkbox" }
    });
    guide.checked = !!settings.guideMode;
    guide.addEventListener("change", () => {
      this.gs.setState({ settings: { guideMode: guide.checked } });
    });

    const gen = el("input", {
      className: "switchControl__input",
      attrs: { type: "checkbox" }
    });
    gen.checked = !!settings.useGeneratedPuzzles;
    gen.addEventListener("change", () => {
      this.gs.setState({ settings: { useGeneratedPuzzles: gen.checked } });
    });

    const diff = el("select", { className: "settingRow__select" });
    const addOpt = (value, label) =>
      diff.appendChild(el("option", { attrs: { value }, text: label }));
    addOpt("easy", DIFFICULTY_LABELS.easy);
    addOpt("normal", DIFFICULTY_LABELS.normal);
    addOpt("hard", DIFFICULTY_LABELS.hard);
    diff.value = settings.difficulty || "normal";
    diff.addEventListener("change", () => {
      this.gs.setState({ settings: { difficulty: diff.value } });
    });

    panel.append(
      el("p", { className: "sub", text: "集中しやすい表示に整えます。" }),
      buildToggleRow("BGM", "おんがくのオン・オフ", bgm),
      buildToggleRow("こうかおん", "ボタンやおしごとの音", sfx),
      buildToggleRow("同じ数をハイライト（予定）", "同じ数字を目で追いやすくします。", hl),
      buildToggleRow("文字を大きめにする", null, large),
      buildToggleRow("ガイドモード（入る数だけ押せる）", null, guide),
      buildToggleRow("問題を自動生成（試験運用）", "毎回ランダムに作る実験機能です。", gen),
      SettingRow({
        label: "空欄の量",
        description: "むずかしさの目安です。",
        control: diff
      }),
      el("p", { className: "hint", text: "※ 音はこれから すこしずつ ふえていきます。" })
    );

    wrap.append(header, panel);

    container.innerHTML = "";
    container.appendChild(wrap);
    this._root = wrap;
  }

  unmount() {
    this._root = null;
  }
}
