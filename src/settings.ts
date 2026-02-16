import { App, PluginSettingTab, Setting } from "obsidian";
import FigJamPlugin from "./main";

export class FigJamSettingTab extends PluginSettingTab {
	plugin: FigJamPlugin;

	constructor(app: App, plugin: FigJamPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "FigJam Plugin Settings" });

		new Setting(containerEl)
			.setName("Open in new tab")
			.setDesc("Open FigJam files in a new tab by default")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.defaultOpenInNewTab)
				.onChange(async (value) => {
					this.plugin.settings.defaultOpenInNewTab = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Webview partition")
			.setDesc("Session partition name for persistent Figma authentication (advanced)")
			.addText(text => text
				.setPlaceholder("persist:figma")
				.setValue(this.plugin.settings.webviewPartition)
				.onChange(async (value) => {
					this.plugin.settings.webviewPartition = value || "persist:figma";
					await this.plugin.saveSettings();
				}));

		containerEl.createEl("p", {
			text: "Note: Changes to some settings may require reopening FigJam files to take effect.",
			cls: "setting-item-description"
		});
	}
}
