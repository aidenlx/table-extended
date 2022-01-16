import { around } from "monkey-around";
import { MarkdownView, TFile, Vault } from "obsidian";

import TableExtended from "./tx-main";

const placeholder = "export2pdf";

const Export2PDFHack = (plugin: TableExtended) => {
  const unloaders = [
    around(MarkdownView.prototype, {
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
      printToPdf: (original) =>
        function (this: MarkdownView) {
          plugin.print2pdfFileCache = this.file;
          // @ts-ignore
          this.file = placeholder;
          original.call(this);
          this.file = plugin.print2pdfFileCache;
        },
    }),
    around(Vault.prototype, {
      cachedRead: (original) =>
        async function (this: Vault, input: TFile | string) {
          if (input === placeholder) {
            const file = plugin.print2pdfFileCache;
            if (!file) {
              throw new Error(
                "Failed to get file from table extended plugin instance",
              );
            }
            return preprocessMarkdown(await original.call(this, file), plugin);
          } else {
            return original.call(this, input as any);
          }
        },
    }),
  ];
  unloaders.forEach((u) => plugin.register(u));
};

/**
 * warp all tables in markdown text with tx codeblock
 */
const preprocessMarkdown = (text: string, plugin: TableExtended) => {
  if (!text) return text;
  const ast = plugin.mdit.parse(text, {});
  let tableStarts: number[] = [],
    tableEnds: number[] = [];
  let linesToRemove: number[] = [];

  ast.forEach((token, index, allTokens) => {
    if (token.type === "table_open") {
      let txTable = false;
      if (index - 3 >= 0) {
        const paraStart = index - 3,
          paraContent = index - 2;
        if (
          allTokens[paraStart].type === "paragraph_open" &&
          allTokens[paraContent].type === "inline" &&
          allTokens[paraContent].content === "-tx-"
        ) {
          // remove -tx- prefix
          linesToRemove.push(token.map![0] - 1);
          txTable = true;
        }
      }
      // process all tables or only tables with -tx- prefix
      if (plugin.settings.handleNativeTable || txTable) {
        tableStarts.push(token.map![0]);
        tableEnds.push(token.map![1]);
      }
    }
  });

  if (tableStarts.length === 0) return text;

  let lines = text.split(/\r?\n/).flatMap((line, index) => {
    // remove -tx- prefix
    if (linesToRemove.includes(index)) return [];
    // warp all tables with tx codeblock
    if (tableStarts.includes(index)) return ["```tx", line];
    if (tableEnds.includes(index)) return ["```", line];
    return [line];
  });
  return lines.join("\n");
};

export default Export2PDFHack;
