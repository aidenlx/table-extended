import {
  MarkdownPostProcessorContext,
  MarkdownRenderer,
  Plugin
} from "obsidian";
import MarkdownIt from "markdown-it";
import mTable from "markdown-it-multimd-table";
import mFootnote from "markdown-it-footnote";
import mdRegex from "@gerhobbelt/markdown-it-regexp";
import mdMark from "markdown-it-mark"

export default class TableExtended extends Plugin {
  mdParser: MarkdownIt;

  async onload(): Promise<void> {
    console.log("loading table-extended");

    const wikiRegex = /(?:(?<!\\)!)?\[\[([^\x00-\x1f|]+?)(?:\\?\|([^\x00-\x1f|]+?))?\]\]/;

    // Initialize mdParaser with default presets
    // Also load plugins
    this.mdParser = MarkdownIt({html: true,})
      .use(mFootnote)
      .use(mdMark)
      .use(mTable, {
        multiline: true,
        rowspan: true,
        headerless: true,
      })
      .use(mdRegex(
          wikiRegex,
          (match: string, setup: unknown, options: unknown) =>
            `<span class="tx-wiki">${match[0]}</span>`
        )
      );

    this.registerMarkdownCodeBlockProcessor("tx", processBlock.bind(this));

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

function processBlock(
  src: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  // import render results
  const result = this.mdParser.render(src);
  el.innerHTML = result;

  for (const e of el.querySelectorAll("span.tx-wiki")) {
    let rawLink = e as HTMLSpanElement
    // put rendered wiki-link element to the end of el.childNodes
    MarkdownRenderer.renderMarkdown(
      rawLink.innerText,
      el,
      ctx.sourcePath,
      null
    );
    // Get rendered wiki-link element
    let temp = el.lastElementChild;

    // Check if text is rendered as expected
    if (
      temp.tagName === "P" &&
      temp.childNodes.length === 1 &&
      temp.childNodes[0].nodeName === "A"
    ) {
      let renderedLink = temp.childNodes[0];
      // Replace raw wiki-link with rendered one
      rawLink.parentNode.replaceChild(renderedLink,rawLink);
    } else {
      console.error(rawLink.innerText,temp);
      console.error("Unexpected rendered HTMLElement, keeping the raw element");
    }
    // Remove temp
    el.removeChild(temp);
  }
}
