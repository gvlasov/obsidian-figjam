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

		new Setting(containerEl)
			.setName("Open in new tab")
			.setDesc("Open files in a new tab by default")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.defaultOpenInNewTab)
				.onChange(async (value) => {
					this.plugin.settings.defaultOpenInNewTab = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Webview partition")
			.setDesc("Session partition name for persistent authentication (advanced)")
			.addText(text => text
				.setValue(this.plugin.settings.webviewPartition)
				.onChange(async (value) => {
					this.plugin.settings.webviewPartition = value || "persist:figma";
					await this.plugin.saveSettings();
				}));

		containerEl.createEl("p", {
			text: "Note: changes to some settings may require reopening files to take effect.",
			cls: "setting-item-description"
		});
	}
}
