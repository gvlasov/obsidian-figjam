import { FileView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { FIGJAM_VIEW_TYPE, FIGJAM_ICON, FIGJAM_NEW_BOARD_URL, FIGJAM_PLACEHOLDER_URL, FigJamFileData } from "./constants";
import FigJamPlugin from "./main";

interface WebviewNavigationEvent extends Event { readonly url: string; }

interface ElectronWebview extends HTMLElement {
	getURL(): string;
	addEventListener(type: string, listener: (e: WebviewNavigationEvent) => void): void;
	removeEventListener(type: string, listener: (e: WebviewNavigationEvent) => void): void;
}

export class FigJamView extends FileView {
	plugin: FigJamPlugin;
	file: TFile | null = null;
	webviewEl: HTMLElement | null = null;
	figjamData: FigJamFileData | null = null;
	isNewDiagram: boolean = false;
	urlPollInterval: number | null = null;

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

	onOpen(): Promise<void> {
		// Container will be populated when a file is loaded
		this.containerEl.addClass("figjam-view");

		// Add native header actions
		this.addAction("external-link", "Open in browser", () => {
			if (!this.isNewDiagram && this.figjamData?.url) {
				window.open(this.figjamData.url, "_blank");
			}
		});

		this.addAction("rotate-cw", "Reload board", () => {
			if (this.webviewEl && 'reload' in this.webviewEl) {
				(this.webviewEl as HTMLElement & { reload: () => void }).reload();
			} else if (this.file) {
				void this.onLoadFile(this.file);
			}
		});

		return Promise.resolve();
	}

	onClose(): Promise<void> {
		this.cleanup();
		return Promise.resolve();
	}

	async onLoadFile(file: TFile): Promise<void> {
		this.file = file;

		try {
			// Read the .figjam file content
			const content = await this.app.vault.read(file);
			this.figjamData = JSON.parse(content) as FigJamFileData;

			// Validate the data
			if (!this.figjamData.url) {
				new Notice("Invalid file: missing URL");
				this.showError("Invalid file: missing URL");
				return;
			}

			// Detect placeholder URL — new-diagram mode
			if (this.figjamData.url === FIGJAM_PLACEHOLDER_URL) {
				this.isNewDiagram = true;
				this.renderNewDiagram();
				return;
			}

			// Update lastOpened timestamp
			this.figjamData.lastOpened = new Date().toISOString();
			await this.app.vault.modify(file, JSON.stringify(this.figjamData, null, 2));

			// Render the FigJam board
			this.renderFigJam();
		} catch {
			new Notice("Failed to load file");
			this.showError("Failed to load file");
		}
	}

	onUnloadFile(file: TFile): Promise<void> {
		this.cleanup();
		this.file = null;
		this.figjamData = null;
		this.isNewDiagram = false;
		return Promise.resolve();
	}

	private renderNewDiagram(): void {
		const { contentEl } = this;
		contentEl.empty();

		const webviewContainer = contentEl.createDiv({ cls: "figjam-webview-container" });

		const webview = document.createElement("webview") as unknown as ElectronWebview;
		(webview as HTMLElement).setAttribute("src", FIGJAM_NEW_BOARD_URL);
		(webview as HTMLElement).setAttribute("allowpopups", "");
		(webview as HTMLElement).setAttribute("partition", this.plugin.settings.webviewPartition);

		const removeListeners = () => {
			webview.removeEventListener("will-navigate", onNavigate);
			webview.removeEventListener("did-navigate", onNavigate);
			webview.removeEventListener("did-navigate-in-page", onNavigate);
			webview.removeEventListener("did-frame-navigate", onNavigate);
			if (this.urlPollInterval !== null) {
				window.clearInterval(this.urlPollInterval);
				this.urlPollInterval = null;
			}
		};

		const onNavigate = (e: WebviewNavigationEvent) => {
			if (this.isRealBoardUrl(e.url)) {
				removeListeners();
				void this.captureAndPersistUrl(e.url);
			}
		};

		webview.addEventListener("will-navigate", onNavigate);
		webview.addEventListener("did-navigate", onNavigate);
		webview.addEventListener("did-navigate-in-page", onNavigate);
		webview.addEventListener("did-frame-navigate", onNavigate);

		// Polling fallback: getURL() always reflects the current URL regardless of navigation type
		this.urlPollInterval = window.setInterval(() => {
			const currentUrl = webview.getURL();
			if (currentUrl && this.isRealBoardUrl(currentUrl)) {
				removeListeners();
				void this.captureAndPersistUrl(currentUrl);
			}
		}, 500);

		this.webviewEl = webview as unknown as HTMLElement;
		webviewContainer.appendChild(this.webviewEl);
	}

	private isRealBoardUrl(url: string): boolean {
		try {
			const parsed = new URL(url);
			if (!parsed.hostname.includes("figma.com")) return false;
			if (!parsed.pathname.includes("/board/")) return false;
			// Reject the placeholder/creation URL
			const afterBoard = parsed.pathname.split("/board/")[1];
			if (!afterBoard || afterBoard === "new" || afterBoard.startsWith("new")) return false;
			return true;
		} catch {
			return false;
		}
	}

	private async captureAndPersistUrl(url: string): Promise<void> {
		if (!this.figjamData || !this.file) return;

		this.figjamData.url = url;
		this.figjamData.lastOpened = new Date().toISOString();

		await this.app.vault.modify(this.file, JSON.stringify(this.figjamData, null, 2));
		this.isNewDiagram = false;
	}

	private renderFigJam(): void {
		const { contentEl } = this;
		contentEl.empty();

		// Create webview container
		const webviewContainer = contentEl.createDiv({ cls: "figjam-webview-container" });

		try {
			// Try to create an Electron webview
			this.webviewEl = document.createElement("webview");
			this.webviewEl.setAttribute("src", this.figjamData!.url);
			this.webviewEl.setAttribute("allowpopups", "");
			this.webviewEl.setAttribute("partition", this.plugin.settings.webviewPartition);

			// Add event listeners for debugging
			this.webviewEl.addEventListener("did-fail-load", () => {
				new Notice("Failed to load diagram");
			});

			webviewContainer.appendChild(this.webviewEl);
		} catch {
			// Fallback to iframe if webview doesn't work
			this.createIframeFallback(webviewContainer);
		}
	}

	private createIframeFallback(container: HTMLElement): void {
		const iframe = container.createEl("iframe", {
			cls: "figjam-iframe"
		});
		iframe.setAttribute("src", this.figjamData!.url);
		iframe.setAttribute("allowfullscreen", "");

		this.webviewEl = iframe;
	}

	private showError(message: string): void {
		const { contentEl } = this;
		contentEl.empty();

		const errorContainer = contentEl.createDiv({ cls: "figjam-error" });
		errorContainer.createEl("h3", { text: "Error loading board" });
		errorContainer.createEl("p", { text: message });

		const retryBtn = errorContainer.createEl("button", { text: "Retry" });
		retryBtn.addEventListener("click", () => {
			if (this.file) {
				void this.onLoadFile(this.file);
			}
		});
	}

	private cleanup(): void {
		if (this.urlPollInterval !== null) {
			window.clearInterval(this.urlPollInterval);
			this.urlPollInterval = null;
		}
		if (this.webviewEl) {
			if (this.webviewEl.remove) {
				this.webviewEl.remove();
			}
			this.webviewEl = null;
		}
	}
}
