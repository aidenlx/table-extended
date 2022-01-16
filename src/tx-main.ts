import MarkdownIt from "markdown-it";
import mTable from "markdown-it-multimd-table";
import {
  MarkdownPostProcessorContext,
  MarkdownPreviewRenderer,
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
import { mditOptions, renderMarkdown } from "./render";

const prefixPatternInMD = /^(?:>\s*)?-tx-\n/;

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

    const raw = getSourceMarkdown(el, ctx);
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
        const src = getSourceMarkdown(el, ctx);
        if (!src) {
          console.warn("failed to get Markdown text, escaping...");
        } else if ((result = src.match(prefixPatternInMD))) {
          const footnoteSelector = "sup.footnote-ref";
          // save footnote refs
          const footnoteRefs = [
            ...el.querySelectorAll(footnoteSelector),
          ] as HTMLElement[];
          // footnote refs is replaced by new ones during rendering
          this.renderFromMD(src.substring(result[0].length), el, ctx);
          // post process to revert footnote refs
          for (const newRefs of el.querySelectorAll(footnoteSelector)) {
            newRefs.replaceWith(footnoteRefs.shift()!);
          }
          for (const fnSection of el.querySelectorAll("section.footnotes")) {
            fnSection.remove();
          }
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

  renderFromMD = renderMarkdown.bind(this);
}

const getSourceMarkdown = (
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
