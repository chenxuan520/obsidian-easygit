import {FileSystemAdapter, SuggestModal, App, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';
import {simpleGit, SimpleGit} from 'simple-git';

// Remember to rename these classes and interfaces!

interface ObsidianEasyGitSettings {
	afterShell: string;
	icon: boolean;
}

const DEFAULT_SETTINGS: ObsidianEasyGitSettings = {
	afterShell: '',
	icon: true
}

export default class ObsidianEasyGit extends Plugin {
	settings: ObsidianEasyGitSettings;
	git: SimpleGit

	async onload() {
		await this.loadSettings();
		await this.init();

		if (this.settings.icon) {
			// This creates an icon in the left ribbon.
			const ribbonIconEl = this.addRibbonIcon('dice', 'git commit', () => {
				// Called when the user clicks the icon.
				this.gitcommit();
			});
			// Perform additional things with the ribbon
			ribbonIconEl.addClass('my-plugin-ribbon-class');
		}

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		/* const statusBarItemEl = this.addStatusBarItem(); */
		/* statusBarItemEl.setText('easygit is load'); */

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'Git commit',
			name: 'commit source',
			callback: () => {
				this.gitcommit();
				if (this.settings.afterShell.length!=0) {
				}
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'Git pull',
			name: 'pull remote source',
			callback: () => {
				this.pull();
				new Notice('pull success')
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						/* new EasyGitModal(this.app).open(); */
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new EasyGitSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
	}

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

	async pull() {
		this.git.pull()
	}

	async push() {
		this.git.push()
	}

	async gitcommit() {
		new EasyGitModal(this.app, (text) => {
			const msg = new Date().toLocaleString()
			this.git.add(".")
			this.git.commit(text + " " + msg, (err) => {
				if (err != null) {
					new Notice("Commit wrong:" + err.message)
				} else {
					new Notice("Commit ok")
				}
			})
		}).open();
		if (this.git.remote.length != 0) {
			this.git.push()
			new Notice("Push ok")
		}
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

		new Setting(containerEl)
			.setName('AfterShell')
			.setDesc('run shell after exec commit')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.afterShell)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.afterShell = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('IconOpen')
			.setDesc('is icon open,default true')
			.addToggle(tog => tog.setValue(true).onChange(
				async (value) => {
					this.plugin.settings.icon = value;
				}
			))
	}
}

interface Oper {
	operator: string;
	/* callback: ()=>void; */
}

const ALL_BOOKS = [
	{operator: "git commit", },
	{operator: "git push", },
	{operator: "git pull", },
];

export class ExampleModal extends SuggestModal<Oper> {
	// Returns all available suggestions.
	getSuggestions(query: string): Oper[] {
		return ALL_BOOKS.filter((book) =>
			book.operator.toLowerCase().includes(query.toLowerCase())
		);
	}

	// Renders each suggestion item.
	renderSuggestion(oper: Oper, el: HTMLElement) {
		el.createEl("div", {text: oper.operator});
	}

	// Perform action on the selected suggestion.
	onChooseSuggestion(oper: Oper) {
		new Notice(`Selected ${oper.operator}`);
	}
}
