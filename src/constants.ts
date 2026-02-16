export const FIGJAM_VIEW_TYPE = "figjam-view";
export const FIGJAM_ICON = "layout-dashboard";

export interface FigJamFileData {
	url: string;
	title: string;
	created: string;
	lastOpened: string;
}

export interface FigJamPluginSettings {
	defaultOpenInNewTab: boolean;
	webviewPartition: string;
}

export const DEFAULT_SETTINGS: FigJamPluginSettings = {
	defaultOpenInNewTab: true,
	webviewPartition: "persist:figma"
};
