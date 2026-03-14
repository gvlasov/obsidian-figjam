export const FIGJAM_VIEW_TYPE = "figjam-view";
export const FIGJAM_ICON = "layout-dashboard";
export const FIGJAM_NEW_BOARD_URL = "https://www.figma.com/board/new?t=SvyjAGWpMOOcgWhI-0";
export const FIGJAM_PLACEHOLDER_URL = "https://www.figma.com/board/new";

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
