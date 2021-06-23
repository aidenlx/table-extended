import TableExtended from "main";
import {
  App,
  MarkdownPreviewRenderer,
  PluginSettingTab,
  Setting,
} from "obsidian";

export interface TableExtendedSettings {
  handleNativeTable: boolean;
}

export const DEFAULT_SETTINGS: TableExtendedSettings = {
  handleNativeTable: true,
};

type option = {
  k: keyof TableExtendedSettings;
  name: string;
  desc: string | DocumentFragment;
};

export class TableExtendedSettingTab extends PluginSettingTab {
  plugin: TableExtended;

  constructor(app: App, plugin: TableExtended) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();
    new Setting(this.containerEl)
      .setName("Extended Native Table Syntax")
      .setDesc(
        createFragment((descEl) => {
          descEl.appendText(
            "Disbale this option if some table features is broken, and open new issue in ",
          );
          descEl.appendChild(
            createEl("a", {
              text: "here",
              attr: {
                href: "https://github.com/alx-plugins/table-extended/issues",
              },
            }),
          );
        }),
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.handleNativeTable)
          .onChange(async (value) => {
            this.plugin.settings.handleNativeTable = value;
            if (value)
              MarkdownPreviewRenderer.registerPostProcessor(
                this.plugin.processTable,
              );
            else
              MarkdownPreviewRenderer.unregisterPostProcessor(
                this.plugin.processTable,
              );
            this.plugin.refresh();
            this.plugin.saveData(this.plugin.settings);
            this.display();
          }),
      );
  }

  options: option[] = [
    {
      k: "handleNativeTable",
      name: "Extended Native Table Syntax",
      desc: (() => {
        const descEl = document.createDocumentFragment();
        descEl.appendText(
          "Disbale this option if some table features is broken",
        );
        descEl.appendChild(document.createElement("br"));
        descEl.appendText("And open new issue in ");
        descEl.appendChild(
          createEl("a", {
            text: "here",
            attr: {
              href: "https://github.com/alx-plugins/table-extended/issues",
            },
          }),
        );
        return descEl;
      })(),
    },
  ];
}
