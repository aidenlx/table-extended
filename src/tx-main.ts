import MarkdownIt from "markdown-it";
import mTable from "markdown-it-multimd-table";
import {
  MarkdownPostProcessorContext,
  MarkdownPreviewRenderer,
  MarkdownRenderChild,
  MarkdownRenderer,
  MarkdownView,
  Plugin,
} from "obsidian";
import {
  DEFAULT_SETTINGS,
  TableExtendedSettings,
  TableExtendedSettingTab,
} from "settings";
export default class TableExtended extends Plugin {
  settings: TableExtendedSettings = DEFAULT_SETTINGS;
  async loadSettings() {
    this.settings = { ...this.settings, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  constructor(...args: ConstructorParameters<typeof Plugin>) {
    super(...args);
    this.mdit = MarkdownIt({ html: true }).use(mTable, {
      multiline: true,
      rowspan: true,
      headerless: true,
    });
    /** keep only table required features, let obsidian handle the markdown inside cell */
    this.mdit.block.ruler.enableOnly([
      "table",
      "paragraph",
      "reference",
      "blockquote",
    ]);
    this.mdit.inline.ruler.enableOnly([]);
  }
  mdit: MarkdownIt;
  renderTable(raw: string) {
    return this.mdit.render(raw);
  }

  processTable = (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    if (!el.querySelector("table")) return;

    const raw = getSrcMD(el, ctx);
    if (!raw) {
      console.warn("failed to get Markdown text, escaping...", el.innerHTML);
      return;
    }
    el.empty();
    this.renderFromMD(raw, el, ctx);
  };
  processTextSection = (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const firstEl = el.firstElementChild;
    if (!firstEl) return;
    let p: HTMLParagraphElement;
    if (firstEl instanceof HTMLParagraphElement) {
      p = firstEl;
    } else if (
      firstEl instanceof HTMLQuoteElement &&
      firstEl.firstElementChild instanceof HTMLParagraphElement
    ) {
      p = firstEl.firstElementChild;
    } else return;

    const prefixInMd = /^(?:>\s*)?-tx-\n/;
    let result;
    if (p.innerHTML.startsWith("-tx-")) {
      const src = getSrcMD(el, ctx);
      if (!src) {
        if (this.settings.forceNoParaResolve) {
          console.warn(
            "failed to get Markdown text, escaping...",
            el.innerHTML,
          );
        } else {
          console.log(
            "failed to get Markdown text, resolve text from <p> content...",
          );
          this.renderFromPara(
            p,
            firstEl instanceof HTMLQuoteElement ? firstEl : el,
          );
        }
      } else if ((result = src.match(prefixInMd))) {
        this.renderFromMD(src.substring(result[0].length), el, ctx);
      }
    }
  };

  async onload(): Promise<void> {
    console.log("loading table-extended");
    await this.loadSettings();
    this.addSettingTab(new TableExtendedSettingTab(this.app, this));

    if (this.settings.handleNativeTable)
      MarkdownPreviewRenderer.registerPostProcessor(this.processTable);

    this.registerMarkdownCodeBlockProcessor("tx", this.renderFromMD);
    this.registerMarkdownPostProcessor(this.processTextSection);

    // Read Obsidian's config to keep "strictLineBreaks" option in sync
    this.mdit.set({
      breaks: !this.app.vault.getConfig("strictLineBreaks"),
    });
    this.app.workspace.onLayoutReady(this.refresh);
  }

  onunload() {
    console.log("unloading table-extended");
    MarkdownPreviewRenderer.unregisterPostProcessor(this.processTable);
    this.refresh();
  }
  /** refresh opened MarkdownView */
  refresh = () =>
    this.app.workspace.iterateAllLeaves((leaf) =>
      setTimeout(() => {
        if (leaf.view instanceof MarkdownView) {
          leaf.view.previewMode.rerender(true);
        }
      }, 200),
    );

  /**
   * Fallback method, regular escape char will not take effect
   */
  renderFromPara = (textEl: HTMLParagraphElement, containerEl: HTMLElement) => {
    let elMap = new Map<string, Element>();
    // remove all br from strictLineBreak=false
    textEl.querySelectorAll("br").forEach((br) => br.remove());
    // extract html elements and save them in temp key-el map
    for (let i = 0; i < textEl.children.length; i++) {
      const el = textEl.children[i],
        id = `!HTMLEL_${i}!`;
      el.insertAdjacentText("afterend", id);
      elMap.set(id, el);
      el.remove();
    }
    if (!textEl.textContent) return;

    const result = this.renderTable(textEl.textContent.replace(/^-tx-\n/, ""));
    containerEl.empty();
    containerEl.innerHTML = result;
    // put el back to rendered table
    let walk = document.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT),
      text: Text;
    while ((text = walk.nextNode() as Text)) {
      insertEl(text, elMap);
    }
    elMap.clear();
  };
  renderFromMD = (
    src: string,
    blockEl: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) => {
    let child = new MarkdownRenderChild(blockEl);
    ctx.addChild(child);
    // import render results
    const result = this.renderTable(src);
    blockEl.innerHTML = result;
    for (const el of blockEl.querySelectorAll("td, th, caption")) {
      let raw = el.textContent;
      if (!raw?.trim()) continue;
      el.textContent = null;
      MarkdownRenderer.renderMarkdown(
        raw,
        el as HTMLElement,
        ctx.sourcePath,
        child,
      );
      let renderedFirstBlock = el.firstElementChild;
      if (renderedFirstBlock) {
        const from = renderedFirstBlock;
        // copy attr set in markdown-attribute
        ["style", "class", "id"].forEach((attr) => copyAttr(attr, from, el));
        if (
          renderedFirstBlock instanceof HTMLElement &&
          el instanceof HTMLElement
        ) {
          Object.assign(el.dataset, renderedFirstBlock.dataset);
        }
        renderedFirstBlock.replaceWith(...renderedFirstBlock.childNodes);
      }
    }
  };
}

const copyAttr = (attr: string, from: Element, to: Element) => {
  if (from.hasAttribute(attr)) {
    to.setAttribute(attr, from.getAttribute(attr)!);
  }
};

const getSrcMD = (
  sectionEl: HTMLElement,
  ctx: MarkdownPostProcessorContext,
): string | null => {
  let info = ctx.getSectionInfo(sectionEl);
  if (info) {
    const { text, lineStart, lineEnd } = info;
    return text
      .split("\n")
      .slice(lineStart, lineEnd + 1)
      .join("\n");
  } else {
    return null;
  }
};

const pattern = /!HTMLEL_\d+?!/g;
const insertEl = (text: Text, toFind: Map<string, Element>) => {
  for (const str of [...text.wholeText.matchAll(pattern)]
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map((arr) => arr[0])) {
    let el = toFind.get(str);
    if (!el) continue;
    insertElToText(text, str, el);
    toFind.delete(str);
  }
};

const insertElToText = (text: Text, pattern: string, toInsert: Element) => {
  let index = text.wholeText.indexOf(pattern);
  if (index < 0) return;
  text = text.splitText(index);
  text.parentElement?.insertBefore(toInsert, text);
  text.textContent = text.wholeText.substring(pattern.length);
  return text;
};
