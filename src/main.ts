import {
  App,
  MarkdownPostProcessorContext,
  MarkdownRenderer,
  Plugin,
  PluginManifest,
} from "obsidian";
import MarkdownIt from "markdown-it";
import mTable from "markdown-it-multimd-table";
import mFootnote from "markdown-it-footnote";
import mdRegex from "@gerhobbelt/markdown-it-regexp";

// interface MyPluginSettings {
// 	mySetting: string;
// }

// const DEFAULT_SETTINGS: MyPluginSettings = {
// 	mySetting: 'default'
// }

export default class TableExtended extends Plugin {
  // settings: MyPluginSettings;

  mdParser: MarkdownIt;

  async onload(): Promise<void> {

		console.log("loading table-extended");

		const wikiRegex = /(?:(?<!\\)!)?\[\[([^\x00-\x1f|]+?)(?:\\?\|([\s\S]+?))?\]\]/;

    this.mdParser = MarkdownIt()
      .use(mFootnote)
      .use(mTable, {
        multiline: true,
        rowspan: true,
        headerless: true,
      })
      .use(
        mdRegex(
          wikiRegex,
          (match: string, setup: unknown, options: unknown) =>
            `<span class="tx-wiki">${match[0]}</span>`
        )
      );

    this.registerMarkdownCodeBlockProcessor(
      "tx", processBlock.bind(this)
    );
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
		MarkdownRenderer.renderMarkdown(
			(rawLink as HTMLSpanElement).innerText,
			el, ctx.sourcePath, null );
		let temp = el.lastElementChild;
		rawLink.outerHTML = temp.innerHTML;
		el.removeChild(temp);
	}
}
