import { el } from "../ui/dom.js";
import { HeaderBar, Panel, Button } from "../ui/components.js";
import { getLatestLearningLog } from "../state/learningLog.js";
import { getBadgesForLog } from "../state/badges.js";

export class ResultScreen {
  constructor(screenManager, gameState, params = {}) {
    this.sm = screenManager;
    this.gs = gameState;
    this.params = params;
    this.name = "result";
    this._root = null;
  }

  mount(container) {
    const levelSize = Number(this.params.levelSize || 3);
    const cleared = Boolean(this.params.cleared);

    const wrap = el("div", { className: "screen screen--menu" });
    const header = HeaderBar({ title: "リザルト" });
    const panel = Panel();

    const title = el("h2", {
      className: "title",
      text: cleared ? "クリア！" : "おつかれさま"
    });

    const sub = el("p", {
      className: "sub",
      text: cleared ? "できた。次もいける。" : "今日はここまででも大丈夫。"
    });

    const logEntry = cleared ? getLatestLearningLog() : null;
    const reflection = cleared && logEntry ? this._buildReflection(logEntry) : null;
    const badges = cleared && logEntry ? getBadgesForLog(logEntry) : [];

    if (cleared) {
      this.gs.markLevelCleared(levelSize);
    }
    this.gs.endSession();

    const nextPuzzle = Button({
      text: "次の問題へ（同じレベル）",
      variant: "primary",
      onClick: () => this.sm.changeScreen("game", { levelSize })
    });

    const toLevels = Button({
      text: "レベル選択へ",
      variant: "secondary",
      onClick: () => this.sm.changeScreen("levels")
    });

    const toTitle = Button({
      text: "タイトルへ",
      variant: "secondary",
      onClick: () => this.sm.changeScreen("title")
    });

    panel.append(title, sub);
    if (badges.length) {
      panel.append(this._buildBadges(badges));
    }
    if (reflection) {
      panel.append(reflection);
    }
    panel.append(nextPuzzle, toLevels, toTitle);
    wrap.append(header, panel);

    container.innerHTML = "";
    container.appendChild(wrap);
    this._root = wrap;
  }

  unmount() {
    this._root = null;
  }

  _buildBadges(badges) {
    const wrap = el("section", { className: "resultBadges" });
    wrap.append(
      el("h3", { className: "resultBadges__title", text: "きょうの たからもの" })
    );
    const list = el("div", { className: "resultBadges__list" });
    badges.forEach((badge) => {
      list.appendChild(
        el("span", { className: "resultBadges__item", text: badge.label })
      );
    });
    wrap.append(list);
    return wrap;
  }

  _buildReflection(logEntry) {
    const section = el("section", { className: "resultReflection" });
    const heading = el("h3", {
      className: "resultReflection__title",
      text: "ふりかえり"
    });
    const intro = el("p", {
      className: "resultReflection__lead",
      text: "つぎに いかせる きづきだよ。"
    });

    const mistakeLine = this._buildMistakeLine(logEntry);
    const helpLine = this._buildHelpLine(logEntry);

    section.append(heading, intro, mistakeLine, helpLine);
    return section;
  }

  _buildMistakeLine(logEntry) {
    const entries = Object.entries(logEntry.mistakeCells || {});
    if (!entries.length) {
      return el("p", {
        className: "resultReflection__item",
        text: "ここで ちょっと まよったね：とくになし！"
      });
    }
    const top = entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => {
        const [r, c] = key.split(",").map((value) => Number(value) + 1);
        return `${r}ぎょう${c}れつ`;
      });
    return el("p", {
      className: "resultReflection__item",
      text: `ここで ちょっと まよったね：${top.join("、")}`
    });
  }

  _buildHelpLine(logEntry) {
    const counts = logEntry.helpUsedCounts || {};
    const look = counts.look || 0;
    const narrow = counts.narrow || 0;
    const fill = counts.fill || 0;
    const total = look + narrow + fill;
    if (!total) {
      return el("p", {
        className: "resultReflection__item",
        text: "たすけを つかわずに がんばった！"
      });
    }
    const pieces = [];
    if (look) pieces.push(`ここを示す ${look}回`);
    if (narrow) pieces.push(`候補 ${narrow}回`);
    if (fill) pieces.push(`1マス ${fill}回`);
    return el("p", {
      className: "resultReflection__item",
      text: `たすけを つかって がんばった！(${pieces.join(" / ")})`
    });
  }
}
