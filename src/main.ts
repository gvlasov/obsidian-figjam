import { Notice, Plugin, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, FigJamPluginSettings, FIGJAM_VIEW_TYPE, FIGJAM_ICON, FigJamFileData } from "./constants";
import { FigJamSettingTab } from "./settings";
import { FigJamView } from "./FigJamView";
import { CreateFigJamModal } from "./CreateFigJamModal";

export default class FigJamPlugin extends Plugin {
	settings: FigJamPluginSettings;

	async onload() {
		await this.loadSettings();

		// Register the .figjam file extension
		this.registerExtensions(["figjam"], FIGJAM_VIEW_TYPE);

		// Register the FigJam view
		this.registerView(
			FIGJAM_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new FigJamView(leaf, this)
		);

		// Command: Create new FigJam file
		this.addCommand({
			id: 'create-figjam-file',
			name: 'Create new FigJam diagram',
			callback: () => {
				this.createFigJamFile(null);
			}
		});

		// Command: Open FigJam URL (without saving)
		this.addCommand({
			id: 'open-figjam-url',
			name: 'Open FigJam URL',
			callback: () => {
				// For future implementation - quick open without file
				new Notice("This feature is coming soon! For now, use 'Create new FigJam diagram' to save and open.");
			}
		});

		// Register file menu event for folder context menu
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (file instanceof TFolder) {
					menu.addItem((item) => {
						item
							.setTitle("New FigJam diagram")
							.setIcon(FIGJAM_ICON)
							.onClick(() => {
								this.createFigJamFile(file);
							});
					});
				}
			})
		);

		// Register settings tab
		this.addSettingTab(new FigJamSettingTab(this.app, this));

		console.log("FigJam plugin loaded");
	}

	onunload() {
		console.log("FigJam plugin unloaded");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<FigJamPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private createFigJamFile(targetFolder: TFolder | null): void {
		new CreateFigJamModal(this.app, targetFolder, async (data: FigJamFileData, fileName: string) => {
			try {
				// Determine the file path
				const folderPath = targetFolder ? targetFolder.path : "";
				const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

				// Check if file already exists
				const existingFile = this.app.vault.getAbstractFileByPath(filePath);
				if (existingFile) {
					new Notice(`File ${fileName} already exists!`);
					return;
				}

				// Create the .figjam file
				const fileContent = JSON.stringify(data, null, 2);
				const file = await this.app.vault.create(filePath, fileContent);

				// Open the file
				await this.openFigJamFile(file);

				new Notice(`Created FigJam diagram: ${fileName}`);
			} catch (error) {
				console.error("Error creating FigJam file:", error);
				new Notice("Failed to create FigJam file");
			}
		}).open();
	}

	private async openFigJamFile(file: TFile): Promise<void> {
		// Open in new tab or replace current based on settings
		let leaf: WorkspaceLeaf | null = null;

		if (this.settings.defaultOpenInNewTab) {
			leaf = this.app.workspace.getLeaf("tab");
		} else {
			leaf = this.app.workspace.getLeaf(false);
		}

		if (leaf) {
			await leaf.openFile(file);
		}
	}
}
