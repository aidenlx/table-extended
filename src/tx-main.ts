import mdRegex from "@gerhobbelt/markdown-it-regexp";
import MarkdownIt from "markdown-it";
import mFootnote from "markdown-it-footnote";
import mdMark from "markdown-it-mark";
import mTable from "markdown-it-multimd-table";
import {
  MarkdownPostProcessorContext,
  MarkdownPreviewRenderer,
  MarkdownRenderer,
  MarkdownView,
  Plugin,
} from "obsidian";
import {
  DEFAULT_SETTINGS,
  TableExtendedSettings,
  TableExtendedSettingTab,
} from "settings";

const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const wikiRegex =
  /(?:(?<!\\)!)?\[\[([^\x00-\x1f|]+?)(?:\\?\|([^\x00-\x1f|]+?))?\]\]/;
export default class TableExtended extends Plugin {
  settings: TableExtendedSettings = DEFAULT_SETTINGS;
  async loadSettings() {
    this.settings = { ...this.settings, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  mdParser = MarkdownIt({ html: true })
    .use(mFootnote)
    .use(mdMark)
    .use(mTable, {
      multiline: true,
      rowspan: true,
      headerless: true,
    })
    .use(
      mdRegex(
        wikiRegex,
        (match: string, setup: unknown, options: unknown) =>
          `<span class="tx-wiki">${match[0]}</span>`,
      ),
    );

  processTable = async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    if (!el.querySelector("table")) return;

    const raw = await getRawSection(el, ctx);
    if (!raw) {
      console.warn("failed to get Markdown text, escaping...", el.innerHTML);
      return;
    }

    el.empty();
    el.innerHTML = this.mdParser.render(raw);
    processInternalLink(el, ctx.sourcePath);
  };

  processTextSection = async (
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) => {
    const firstEl = el.firstElementChild;
    if (
      !(
        firstEl instanceof HTMLParagraphElement &&
        firstEl.innerHTML.startsWith("-tx-")
      )
    )
      return;
    let raw = await getRawSection(el, ctx);
    if (!raw) {
      console.warn("failed to get Markdown text, escaping...", el.innerHTML);
      return;
    }
    if (!raw.startsWith("-tx-\n")) return;
    raw = raw.replace(/^-tx-\n/, "");

    el.empty();
    el.innerHTML = this.mdParser.render(raw);
    processInternalLink(el, ctx.sourcePath);
  };

  processCodeBlock = (
    src: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) => {
    // import render results
    const result = this.mdParser.render(src);
    el.innerHTML = result;

    processInternalLink(el, ctx.sourcePath);
  };

  async onload(): Promise<void> {
    console.log("loading table-extended");
    await this.loadSettings();
    this.addSettingTab(new TableExtendedSettingTab(this.app, this));

    if (this.settings.handleNativeTable)
      MarkdownPreviewRenderer.registerPostProcessor(this.processTable);

    this.registerMarkdownCodeBlockProcessor("tx", this.processCodeBlock);
    this.registerMarkdownPostProcessor(this.processTextSection);

    // Read Obsidian's config to keep "strictLineBreaks" option in sync
    this.mdParser.set({
      // @ts-ignore As this is undocumented
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
}

const getRawSection = async (
  sectionEl: HTMLElement,
  ctx: MarkdownPostProcessorContext,
): Promise<string | null> => {
  let tries = 0,
    info: null | { text: string; lineStart: number; lineEnd: number };
  while (tries < 5) {
    info = ctx.getSectionInfo(sectionEl);
    if (info) {
      const { text, lineStart, lineEnd } = info;
      return text
        .split("\n")
        .slice(lineStart, lineEnd + 1)
        .join("\n");
    } else {
      tries++;
      await sleep(200);
    }
  }
  return null;
};

const processInternalLink = (el: HTMLElement, sourcePath: string) => {
  for (const e of el.querySelectorAll("span.tx-wiki")) {
    let rawLink = e as HTMLSpanElement;
    const rawText = rawLink.innerText;
    // put rendered wiki-link element to the end of el.childNodes
    // @ts-ignore
    MarkdownRenderer.renderMarkdown(rawText, el, sourcePath, null);
    // Get rendered wiki-link element
    let temp = el.lastElementChild;
    if (!temp) throw new Error("No rendered child found");

    const selector = rawText.startsWith("!")
      ? ":scope > span.internal-embed"
      : ":scope > a.internal-link";
    const renderedLink = temp.querySelector(selector);
    if (renderedLink) {
      // Replace raw wiki-link with rendered one
      if (!rawLink.parentNode)
        console.error("failed to replace: %o has no parentNode", rawLink);
      else rawLink.parentNode.replaceChild(renderedLink, rawLink);
    } else {
      console.error(rawLink.innerText, temp);
      console.error("No match found, keeping the raw element");
    }
    // Remove temp
    el.removeChild(temp);
  }
};
