import { App, Modal, Notice, Setting, TFolder } from "obsidian";
import { FigJamFileData } from "./constants";

export class CreateFigJamModal extends Modal {
	title: string = "";
	url: string = "";
	targetFolder: TFolder | null = null;
	onSubmit: (data: FigJamFileData, fileName: string) => void;

	constructor(app: App, targetFolder: TFolder | null, onSubmit: (data: FigJamFileData, fileName: string) => void) {
		super(app);
		this.targetFolder = targetFolder;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Create New FigJam Diagram" });

		// Title input
		new Setting(contentEl)
			.setName("Diagram Title")
			.setDesc("A descriptive title for this FigJam diagram")
			.addText(text => text
				.setPlaceholder("My FigJam Diagram")
				.setValue(this.title)
				.onChange(value => {
					this.title = value;
				}));

		// URL input
		new Setting(contentEl)
			.setName("FigJam URL")
			.setDesc("The URL of the FigJam board (e.g., https://www.figma.com/board/...)")
			.addText(text => text
				.setPlaceholder("https://www.figma.com/board/...")
				.setValue(this.url)
				.onChange(value => {
					this.url = value;
				}));

		// Target folder display
		if (this.targetFolder) {
			new Setting(contentEl)
				.setName("Location")
				.setDesc(`File will be created in: ${this.targetFolder.path || "/"}`);
		}

		// Submit button
		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText("Create")
				.setCta()
				.onClick(() => {
					this.submit();
				}))
			.addButton(btn => btn
				.setButtonText("Cancel")
				.onClick(() => {
					this.close();
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private submit(): void {
		// Validate title
		if (!this.title.trim()) {
			new Notice("Please enter a title for the FigJam diagram");
			return;
		}

		// Validate URL
		if (!this.url.trim()) {
			new Notice("Please enter a FigJam URL");
			return;
		}

		// Validate URL format
		if (!this.isValidFigJamUrl(this.url)) {
			new Notice("Invalid FigJam URL. Must be a figma.com/board/ or figma.com/figjam/ URL");
			return;
		}

		// Create file data
		const now = new Date().toISOString();
		const fileData: FigJamFileData = {
			url: this.url.trim(),
			title: this.title.trim(),
			created: now,
			lastOpened: now
		};

		// Generate file name from title
		const fileName = this.sanitizeFileName(this.title) + ".figjam";

		this.onSubmit(fileData, fileName);
		this.close();
	}

	private isValidFigJamUrl(url: string): boolean {
		try {
			const parsedUrl = new URL(url);
			return (
				parsedUrl.hostname.includes("figma.com") &&
				(parsedUrl.pathname.includes("/board/") || parsedUrl.pathname.includes("/figjam/"))
			);
		} catch {
			return false;
		}
	}

	private sanitizeFileName(name: string): string {
		// Remove invalid file name characters and limit length
		return name
			.replace(/[\\/:*?"<>|]/g, "-")
			.replace(/\s+/g, " ")
			.trim()
			.substring(0, 100);
	}
}
