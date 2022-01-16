import {
  App,
  MarkdownPreviewRenderer,
  PluginSettingTab,
  Setting,
} from "obsidian";
import TableExtended from "tx-main";

export interface TableExtendedSettings {
  handleNativeTable: boolean;
  hackPDF: boolean;
}

export const DEFAULT_SETTINGS: TableExtendedSettings = {
  handleNativeTable: false,
  hackPDF: false,
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
      .setName("Expermental: Extended Native Table Syntax")
      .setDesc(
        createFragment((descEl) => {
          descEl.appendText("Use extended syntax on all native tables");
          descEl.appendChild(createEl("br"));
          descEl.appendText(
            "Some table features may be broken, if found any, please open new issue in ",
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
                this.plugin.processNativeTable,
              );
            else
              MarkdownPreviewRenderer.unregisterPostProcessor(
                this.plugin.processNativeTable,
              );
            this.plugin.refresh();
            this.plugin.saveData(this.plugin.settings);
            this.display();
          }),
      );
    new Setting(this.containerEl)
      .setName("Expermental: Export to PDF support")
      .setDesc(
        createFragment((descEl) => {
          descEl.appendText("Reload obsidian to take effect");
          descEl.appendChild(createEl("br"));
          descEl.appendText(
            "If PDF export is broken with this option enabled, disable this feature and open new issue in ",
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
          .setValue(this.plugin.settings.hackPDF)
          .onChange(async (value) => {
            this.plugin.settings.hackPDF = value;
            this.plugin.saveData(this.plugin.settings);
            this.display();
          }),
      );
  }
}
