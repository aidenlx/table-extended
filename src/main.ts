import {
  MarkdownPostProcessorContext,
  MarkdownRenderer,
  Plugin,
} from "obsidian";
import MarkdownIt from "markdown-it";
import mTable from "markdown-it-multimd-table";
import mFootnote from "markdown-it-footnote";
import mdRegex from "@gerhobbelt/markdown-it-regexp";
import mdMark from "markdown-it-mark";

const wikiRegex =
  /(?:(?<!\\)!)?\[\[([^\x00-\x1f|]+?)(?:\\?\|([^\x00-\x1f|]+?))?\]\]/;
export default class TableExtended extends Plugin {
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

  async onload(): Promise<void> {
    console.log("loading table-extended");

    this.registerMarkdownCodeBlockProcessor("tx", processBlock.bind(this));
    this.registerMarkdownPostProcessor(processTable.bind(this));

    // Read Obsidian's config to keep "strictLineBreaks" option in sync
    this.mdParser.set({
      // @ts-ignore As this is undocumented
      breaks: !this.app.vault.getConfig("strictLineBreaks"),
    });
  }

  onunload() {
    console.log("unloading table-extended");
  }
}

const getRawSection = (
  sectionEl: HTMLElement,
  ctx: MarkdownPostProcessorContext,
): null | string => {
  const info: null | { text: string; lineStart: number; lineEnd: number } =
    // @ts-ignore
    ctx.getSectionInfo(sectionEl);
  if (info) {
    const { text, lineStart, lineEnd } = info;
    return text
      .split("\n")
      .slice(lineStart, lineEnd + 1)
      .join("\n");
  } else return null;
};

function processTable(
  this: TableExtended,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  if (!el.querySelector("table")) return;

  const raw = getRawSection(el, ctx);
  if (!raw) {
    console.error("RawSection null, escaping...");
    return;
  }

  el.empty();
  el.innerHTML = this.mdParser.render(raw);
  processInternalLink(el, ctx.sourcePath);
}

function processBlock(
  this: TableExtended,
  src: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  // import render results
  const result = this.mdParser.render(src);
  el.innerHTML = result;

  processInternalLink(el, ctx.sourcePath);
}

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
