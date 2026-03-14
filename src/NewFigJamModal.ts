import { App, Modal, Notice, Setting, TFolder } from "obsidian";

export class NewFigJamModal extends Modal {
	name: string = "";
	targetFolder: TFolder | null = null;
	onSubmit: (name: string, fileName: string) => void | Promise<void>;

	constructor(app: App, targetFolder: TFolder | null, onSubmit: (name: string, fileName: string) => void | Promise<void>) {
		super(app);
		this.targetFolder = targetFolder;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "New diagram" });

		// Name input
		new Setting(contentEl)
			.setName("Diagram name")
			.addText(text => text
				.setPlaceholder("My diagram")
				.setValue(this.name)
				.onChange(value => {
					this.name = value;
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
		if (!this.name.trim()) {
			new Notice("Please enter a name for the diagram");
			return;
		}

		const fileName = this.sanitizeFileName(this.name) + ".figjam";
		void this.onSubmit(this.name.trim(), fileName);
		this.close();
	}

	private sanitizeFileName(name: string): string {
		return name
			.replace(/[\\/:*?"<>|]/g, "-")
			.replace(/\s+/g, " ")
			.trim()
			.substring(0, 100);
	}
}
