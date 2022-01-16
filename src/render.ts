import type Token from "markdown-it/lib/token";
import {
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  MarkdownRenderer,
} from "obsidian";

import TableExtended from "./tx-main";

export const mditOptions = { html: true };

const elToPreserveText = ["td", "th", "caption"];
/**
 * process ast to extract source markdown text from table cells
 * @param ast ids are added for each table cell
 * @returns array of markdown text, with index being part of id for corresponding cell element
 */
const processAST = (ast: Token[]): string[] => {
  let srcMarkdown: string[] = [];

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
          const index = srcMarkdown.push(content) - 1;
          token.attrSet("id", `TX_${index}`);
          break;
        }
        nextToken = ast[++iInline];
      }
      // skip inline token and close token
      i = iInline;
    }
  }
  return srcMarkdown;
};

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function renderMarkdown(
  this: TableExtended,
  src: string,
  blockEl: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  let child = new MarkdownRenderChild(blockEl);
  ctx.addChild(child);
  // import render results
  const ast = this.mdit.parse(src, {}),
    MarkdownTextInTable = processAST(ast);

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
      ["style", "class", "id"].forEach((attr) => copyAttr(attr, from, parent));
      if (renderedFirstBlock instanceof HTMLElement) {
        Object.assign(parent.dataset, renderedFirstBlock.dataset);
      }
      // unwarp all children to the parent table cell/caption
      if (renderedFirstBlock instanceof HTMLParagraphElement)
        renderedFirstBlock.replaceWith(...renderedFirstBlock.childNodes);
    }
  }
}

const copyAttr = (attr: string, from: Element, to: Element) => {
  if (from.hasAttribute(attr)) {
    to.setAttribute(attr, from.getAttribute(attr)!);
  }
};
