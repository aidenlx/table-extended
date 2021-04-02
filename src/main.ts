import { Plugin } from 'obsidian';
import { processBlock } from './processBlock';

// interface MyPluginSettings {
// 	mySetting: string;
// }

// const DEFAULT_SETTINGS: MyPluginSettings = {
// 	mySetting: 'default'
// }

export default class MyPlugin extends Plugin {
	// settings: MyPluginSettings;

	async onload(): Promise<void> {
		console.log('loading table-extended');

		this.registerMarkdownCodeBlockProcessor("tx", processBlock);
	}

	onunload() {
		console.log('unloading table-extended');
	}

}