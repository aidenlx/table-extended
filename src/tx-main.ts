import MarkdownIt from "markdown-it";
import mTable from "markdown-it-multimd-table";
import {
  MarkdownPostProcessorContext,
  MarkdownPreviewRenderer,
  MarkdownRenderChild,
  MarkdownRenderer,
  MarkdownView,
  Plugin,
  TFile,
} from "obsidian";
import {
  DEFAULT_SETTINGS,
  TableExtendedSettings,
  TableExtendedSettingTab,
} from "settings";

import Export2PDFHack from "./hack-pdf";

const prefixPatternInMD = /^(?:>\s*)?-tx-\n/;

const mditOptions = { html: true };
export default class TableExtended extends Plugin {
  settings: TableExtendedSettings = DEFAULT_SETTINGS;

  print2pdfFileCache: TFile | null = null;

  async loadSettings() {
    this.settings = { ...this.settings, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  constructor(...args: ConstructorParameters<typeof Plugin>) {
    super(...args);
    this.mdit = MarkdownIt(mditOptions).use(mTable, {
      multiline: true,
      rowspan: true,
      headerless: true,
    });
    /** keep only table required features, let obsidian handle the markdown inside cell */
    this.mdit.block.ruler.enableOnly([
      "code",
      "fence",
      "table",
      "paragraph",
      "reference",
      "blockquote",
    ]);
    this.mdit.inline.ruler.enableOnly([]);
  }
  mdit: MarkdownIt;

  processNativeTable = (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    if (!el.querySelector("table")) return;

    const raw = getSrcMD(el, ctx);
    if (!raw) {
      console.warn("failed to get Markdown text, escaping...");
      return;
    }
    el.empty();
    this.renderFromMD(raw, el, ctx);
  };
  processTextSection = (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    // el contains only els for one block in preview;
    // el contains els for all blocks in export2pdf
    for (const child of el.children) {
      let p: HTMLParagraphElement;
      if (child instanceof HTMLParagraphElement) {
        p = child;
      } else if (
        child instanceof HTMLQuoteElement &&
        child.firstElementChild instanceof HTMLParagraphElement
      ) {
        p = child.firstElementChild;
      } else continue;

      let result;
      if (p.innerHTML.startsWith("-tx-")) {
        const src = getSrcMD(el, ctx);
        if (!src) {
          console.warn("failed to get Markdown text, escaping...");
        } else if ((result = src.match(prefixPatternInMD))) {
          this.renderFromMD(src.substring(result[0].length), el, ctx);
        }
      }
    }
  };

  async onload(): Promise<void> {
    console.log("loading table-extended");
    await this.loadSettings();
    this.addSettingTab(new TableExtendedSettingTab(this.app, this));
    if (this.settings.hackPDF) {
      Export2PDFHack(this);
    }

    if (this.settings.handleNativeTable)
      MarkdownPreviewRenderer.registerPostProcessor(this.processNativeTable);

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
    MarkdownPreviewRenderer.unregisterPostProcessor(this.processNativeTable);
    this.refresh();
    this.print2pdfFileCache = null;
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

  renderFromMD = (
    src: string,
    blockEl: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) => {
    let child = new MarkdownRenderChild(blockEl);
    ctx.addChild(child);
    // import render results
    const ast = this.mdit.parse(src, {});
    const elToPreserveText = ["td", "th", "caption"];
    let MarkdownTextInTable: string[] = [];

    for (let i = 0; i < ast.length; i++) {
      const token = ast[i];
      if (elToPreserveText.includes(token.tag) && token.nesting === 1) {
        let iInline = i,
          nextToken = ast[++iInline];
        while (
          // not closing tag
          !elToPreserveText.includes(nextToken.tag) ||
          nextToken.nesting !== -1
        ) {
          let content = "";
          if (nextToken.type === "inline") {
            content = nextToken.content;
          } else if (nextToken.type === "fence") {
            content =
              "```" + nextToken.info + "\n" + nextToken.content + "\n" + "```";
          } else if (nextToken.type === "code_block") {
            content = nextToken.content.replace(/^/gm, "    ");
          }

          if (content) {
            const index = MarkdownTextInTable.push(content) - 1;
            token.attrSet("id", `TX_${index}`);
            break;
          }
          nextToken = ast[++iInline];
        }
        // skip inline token and close token
        i = iInline;
      }
    }
    const result = this.mdit.renderer.render(ast, mditOptions, {});
    blockEl.innerHTML = result;
    for (let el of blockEl.querySelectorAll("[id^=TX_]")) {
      const parent = el as HTMLElement,
        indexText = el.id.substring(3 /* "TX_".length */);
      el.removeAttribute("id");
      if (!Number.isInteger(+indexText)) continue;
      const text = MarkdownTextInTable[+indexText];
      if (!text) continue;
      parent.empty();
      MarkdownRenderer.renderMarkdown(text, parent, ctx.sourcePath, child);

      let renderedFirstBlock = parent.firstElementChild;
      if (renderedFirstBlock) {
        const from = renderedFirstBlock;
        // copy attr set in markdown-attribute
        ["style", "class", "id"].forEach((attr) =>
          copyAttr(attr, from, parent),
        );
        if (renderedFirstBlock instanceof HTMLElement) {
          Object.assign(parent.dataset, renderedFirstBlock.dataset);
        }
        // unwarp all children to the parent table cell/caption
        if (renderedFirstBlock instanceof HTMLParagraphElement)
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
