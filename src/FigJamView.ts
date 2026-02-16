import { FileView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { FIGJAM_VIEW_TYPE, FIGJAM_ICON, FigJamFileData } from "./constants";
import FigJamPlugin from "./main";

export class FigJamView extends FileView {
	plugin: FigJamPlugin;
	file: TFile | null = null;
	webviewEl: any = null;
	figjamData: FigJamFileData | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: FigJamPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return FIGJAM_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.figjamData?.title || "FigJam Diagram";
	}

	getIcon(): string {
		return FIGJAM_ICON;
	}

	async onOpen(): Promise<void> {
		// Container will be populated when a file is loaded
		this.containerEl.addClass("figjam-view");

		// Add native header actions
		this.addAction("external-link", "Open in browser", () => {
			if (this.figjamData?.url) {
				window.open(this.figjamData.url, "_blank");
			}
		});

		this.addAction("rotate-cw", "Reload board", () => {
			if (this.webviewEl && this.webviewEl.reload) {
				this.webviewEl.reload();
			} else if (this.file) {
				this.onLoadFile(this.file);
			}
		});
	}

	async onClose(): Promise<void> {
		this.cleanup();
	}

	async onLoadFile(file: TFile): Promise<void> {
		this.file = file;

		try {
			// Read the .figjam file content
			const content = await this.app.vault.read(file);
			this.figjamData = JSON.parse(content) as FigJamFileData;

			// Validate the data
			if (!this.figjamData.url) {
				new Notice("Invalid .figjam file: missing URL");
				this.showError("Invalid .figjam file: missing URL");
				return;
			}

			// Update lastOpened timestamp
			this.figjamData.lastOpened = new Date().toISOString();
			await this.app.vault.modify(file, JSON.stringify(this.figjamData, null, 2));

			// Render the FigJam board
			this.renderFigJam();
		} catch (error) {
			new Notice("Failed to load FigJam file");
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.showError("Failed to load FigJam file: " + errorMessage);
		}
	}

	async onUnloadFile(file: TFile): Promise<void> {
		this.cleanup();
		this.file = null;
		this.figjamData = null;
	}

	private renderFigJam(): void {
		const { contentEl } = this;
		contentEl.empty();

		// Create webview container
		const webviewContainer = contentEl.createDiv({ cls: "figjam-webview-container" });

		try {
			// Try to create an Electron webview
			this.webviewEl = document.createElement("webview") as any;
			this.webviewEl.setAttribute("src", this.figjamData!.url);
			this.webviewEl.setAttribute("allowpopups", "");
			this.webviewEl.setAttribute("partition", this.plugin.settings.webviewPartition);
			this.webviewEl.style.width = "100%";
			this.webviewEl.style.height = "100%";
			this.webviewEl.style.border = "none";

			// Add event listeners for debugging
			this.webviewEl.addEventListener("did-fail-load", (e: any) => {
				new Notice("Failed to load FigJam diagram");
			});

			webviewContainer.appendChild(this.webviewEl);
		} catch (error) {
			// Fallback to iframe if webview doesn't work
			this.createIframeFallback(webviewContainer);
		}
	}

	private createIframeFallback(container: HTMLElement): void {
		const iframe = container.createEl("iframe", {
			cls: "figjam-iframe"
		});
		iframe.style.width = "100%";
		iframe.style.height = "100%";
		iframe.style.border = "none";
		iframe.setAttribute("src", this.figjamData!.url);
		iframe.setAttribute("allowfullscreen", "");

		this.webviewEl = iframe;
	}

	private showError(message: string): void {
		const { contentEl } = this;
		contentEl.empty();

		const errorContainer = contentEl.createDiv({ cls: "figjam-error" });
		errorContainer.createEl("h3", { text: "Error Loading FigJam Board" });
		errorContainer.createEl("p", { text: message });

		const retryBtn = errorContainer.createEl("button", { text: "Retry" });
		retryBtn.addEventListener("click", () => {
			if (this.file) {
				this.onLoadFile(this.file);
			}
		});
	}

	private cleanup(): void {
		if (this.webviewEl) {
			if (this.webviewEl.remove) {
				this.webviewEl.remove();
			}
			this.webviewEl = null;
		}
	}
}
