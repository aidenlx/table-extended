import {
  MarkdownPostProcessorContext,
  MarkdownRenderer,
  Plugin,
	VaultEx,
} from "obsidian";
import MarkdownIt from "markdown-it";
import mTable from "markdown-it-multimd-table";
import mFootnote from "markdown-it-footnote";
import mdRegex from "@gerhobbelt/markdown-it-regexp";

export default class TableExtended extends Plugin {
  mdParser: MarkdownIt;

  async onload(): Promise<void> {
		console.log("loading table-extended");

		const wikiRegex = /(?:(?<!\\)!)?\[\[([^\x00-\x1f|]+?)(?:\\?\|([\s\S]+?))?\]\]/;

		// Initialize mdParaser with default presets
		// Also load plugins
    this.mdParser = MarkdownIt()
      .use(mFootnote)
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
      breaks: !(<VaultEx>this.app.vault).getConfig("strictLineBreaks"),
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
	const result = this.mdParser.render(src);
	el.innerHTML = result;

	for (const rawLink of el.querySelectorAll("span.tx-wiki")) {
		// put rendered wiki-link element to the end of el.childNodes
		MarkdownRenderer.renderMarkdown(
			(rawLink as HTMLSpanElement).innerText,
			el, ctx.sourcePath, null );
		// Get rendered wiki-link element
		let temp = el.lastElementChild;
		// Replace raw wiki-link with rendered one
		rawLink.outerHTML = temp.innerHTML; // use innerHTML to extract <p><!--rendered---></p>
		// Remove temp
		el.removeChild(temp);
	}
}
