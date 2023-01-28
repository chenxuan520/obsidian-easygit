import {FileSystemAdapter, SuggestModal, App, Modal, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';
import {simpleGit, SimpleGit} from 'simple-git';

// Remember to rename these classes and interfaces!

interface ObsidianEasyGitSettings {
	icon: boolean;
}

const DEFAULT_SETTINGS: ObsidianEasyGitSettings = {
	icon: true
}

export default class ObsidianEasyGit extends Plugin {
	settings: ObsidianEasyGitSettings;
	git: SimpleGit

	async onload() {
		await this.loadSettings();
		await this.init();

		if (this.settings.icon) {
			const ribbonIconEl = this.addRibbonIcon('dice', 'git operator', () => {
				new IconModal(this.app, this).open()
			});
			ribbonIconEl.addClass('my-plugin-ribbon-class');
		}
		this.addCommand({
			id: 'Git commit',
			name: 'commit source',
			callback: () => {
				easyCommit(this)
				/* if (this.settings.afterShell.length != 0) { */
				/* 	exec(this.settings.afterShell) */
				/* } */
			}
		});
		this.addCommand({
			id: 'Git pull',
			name: 'pull remote source',
			callback: () => {
				easyPull(this)
			}
		});
		this.addCommand({
			id: 'Git push',
			name: 'push source to remote',
			callback: () => {
				easyPush(this)
			}
		});
		this.addSettingTab(new EasyGitSettingTab(this.app, this));
		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {}


	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async init() {
		const adapter = this.app.vault.adapter as FileSystemAdapter;
		const path = adapter.getBasePath();
		let basePath = path;
		this.git = simpleGit({
			baseDir: basePath,
			binary: 'git',
			config: ["core.quotepath=off"]
		});
	}
}

function easyCommit(app: ObsidianEasyGit) {
	new EasyGitModal(app.app, (text) => {
		const msg = new Date().toLocaleString()
		app.git.add(".")
		app.git.commit(text + " " + msg, (err) => {
			if (err != null) {
				new Notice("Commit wrong:" + err.message)
			} else {
				new Notice("Commit ok")
				easyPush(app)
			}
		})
	}).open();
}

function easyPull(app: ObsidianEasyGit) {
	app.git.pull()
	new Notice('pull success')
}

function easyPush(app: ObsidianEasyGit) {
	if (app.git.remote.length != 0) {
		app.git.push()
		new Notice("Push ok")
	}
}

class EasyGitModal extends Modal {
	commitMsg: string;
	onSubmit: (result: string) => void;

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const {contentEl} = this;

		contentEl.createEl("h1", {text: "editor commit message"});

		new Setting(contentEl)
			.setName("message")
			.addText((text) =>
				text.onChange((value) => {
					this.commitMsg = value
				}));

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Submit")
					.setCta()
					.onClick(() => {
						this.onSubmit(this.commitMsg);
						this.close();
					}));
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class EasyGitSettingTab extends PluginSettingTab {
	plugin: ObsidianEasyGit;

	constructor(app: App, plugin: ObsidianEasyGit) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for easygit.'});

		/* new Setting(containerEl) */
		/* 	.setName('AfterShell') */
		/* 	.setDesc('run shell after exec commit') */
		/* 	.addText(text => text */
		/* 		.setPlaceholder('Enter your secret') */
		/* 		.setValue(this.plugin.settings.afterShell) */
		/* 		.onChange(async (value) => { */
		/* 			console.log('Secret: ' + value); */
		/* 			this.plugin.settings.afterShell = value; */
		/* 			await this.plugin.saveSettings(); */
		/* 		})); */

		new Setting(containerEl)
			.setName('IconOpen')
			.setDesc('is icon open,default true')
			.addToggle(tog => tog.setValue(this.plugin.settings.icon).onChange(
				async (value) => {
					this.plugin.settings.icon = value;
					await this.plugin.saveSettings();
				}
			))
	}
}

interface Oper {
	operator: string;
	callback: (arg0: ObsidianEasyGit) => void;
}

export class IconModal extends SuggestModal<Oper> {
	plugin: ObsidianEasyGit;
	// Returns all available suggestions.
	constructor(app: App, plugin: ObsidianEasyGit) {
		super(app);
		this.plugin = plugin;
	}
	getSuggestions(): Oper[] {
		const opers = [
			{operator: "commit", callback: easyCommit},
			{operator: "push", callback: easyPush},
			{operator: "pull", callback: easyPull},
		];
		return opers
	}
	// Renders each suggestion item.
	renderSuggestion(oper: Oper, el: HTMLElement) {
		el.createEl("div", {text: oper.operator});
	}
	// Perform action on the selected suggestion.
	onChooseSuggestion(oper: Oper) {
		oper.callback(this.plugin)
	}
}
