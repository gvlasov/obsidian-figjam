# Obsidian FigJam Plugin — Project Spec & Implementation Outline

## Project Overview

Build an Obsidian plugin that makes FigJam documents first-class citizens in Obsidian. The plugin registers a custom `.figjam` file type that stores a FigJam URL. When opened, it renders the full FigJam editor inside Obsidian using an Electron webview, allowing full interactive editing. Users authenticate once with Figma email/password and stay logged in.

## Key Features

1. **Custom `.figjam` file extension** registered in Obsidian, visible in the file explorer
2. **Full FigJam editor** rendered in a custom view via Electron `<webview>` tag (not iframe — Figma blocks iframe embedding)
3. **"New FigJam" command** in the command palette that creates a `.figjam` file and prompts for a FigJam URL
4. **Persistent Figma authentication** — user logs in once inside the webview, session persists across restarts
5. **Graph view integration** — `.figjam` files participate in Obsidian's link graph (support `[[wiki-links]]` to/from FigJam files)
6. **File explorer context menu** — right-click to create a new FigJam file in any folder

## Tech Stack

- TypeScript
- Obsidian Plugin API (https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- Electron webview API (available because Obsidian runs on Electron)
- Starter template: https://github.com/obsidianmd/obsidian-sample-plugin

## File Format

`.figjam` files are plain JSON stored in the vault:

```json
{
  "url": "https://www.figma.com/board/XXXXXX/Board-Name",
  "title": "My FigJam Board",
  "created": "2026-02-16T12:00:00Z",
  "lastOpened": "2026-02-16T12:00:00Z"
}
```

## Architecture & Key Components

### 1. `main.ts` — Plugin Entry Point

```
- Extends `Plugin`
- In `onload()`:
  - Register the `.figjam` file extension via `this.registerExtensions(["figjam"], FIGJAM_VIEW_TYPE)`
  - Register the custom view via `this.registerView(FIGJAM_VIEW_TYPE, (leaf) => new FigJamView(leaf))`
  - Register commands:
    - "Create new FigJam file" — opens a modal to enter URL and title, creates the .figjam file
    - "Open FigJam URL" — quick open a FigJam URL in a new tab without saving a file
  - Register file menu event to add "New FigJam file" to folder context menus
  - Register settings tab for plugin settings
```

### 2. `FigJamView.ts` — Custom ItemView

This is the core of the plugin. It renders the FigJam editor.

```
- Extends `ItemView` (or `FileView` if better suited)
- `getViewType()` returns FIGJAM_VIEW_TYPE constant
- `getDisplayText()` returns the FigJam board title from the .figjam file
- `getIcon()` returns a relevant icon (e.g., "layout-dashboard" or a custom SVG)

- `onOpen()`:
  - Read the .figjam JSON file to get the URL
  - Create an Electron <webview> element (NOT an iframe):
    ```ts
    const webviewEl = document.createElement("webview") as any;
    webviewEl.setAttribute("src", figjamUrl);
    webviewEl.setAttribute("allowpopups", "");
    webviewEl.setAttribute("partition", "persist:figma");  // persistent session for auth
    webviewEl.style.width = "100%";
    webviewEl.style.height = "100%";
    this.contentEl.empty();
    this.contentEl.appendChild(webviewEl);
    ```
  - The `partition: "persist:figma"` is KEY — it ensures Figma login cookies persist across Obsidian restarts
  - Add error handling for webview load failures
  - Optionally add a toolbar above the webview (reload button, open in browser button, title)

- `onClose()`:
  - Clean up the webview element
  - Optionally update `lastOpened` in the .figjam file

- `onLoadFile(file)` / `onUnloadFile(file)`:
  - If extending FileView, handle file open/close lifecycle
```

**IMPORTANT IMPLEMENTATION NOTES for the webview:**

- Obsidian is an Electron app, so the `<webview>` tag is available in the renderer process. However, Obsidian may or may not have `webviewTag: true` in its BrowserWindow webPreferences. If it doesn't, the `<webview>` tag won't work and you'll need to fall back to an `<iframe>`. Test this first.
- If `<webview>` doesn't work, try `<iframe>` with the full Figma URL. It might work since Obsidian's Electron context may not enforce X-Frame-Options the same way a browser does.
- If neither works natively, explore using `BrowserView` via Obsidian's Electron remote module, though this is more complex and hacky.
- The FIRST thing to validate is: can you get Figma's editor to load and be interactive inside the plugin's view? Build a minimal proof of concept for just this before implementing anything else.

### 3. `CreateFigJamModal.ts` — Modal for Creating New FigJam Files

```
- Extends `Modal`
- Shows a form with:
  - Title input (text field)
  - FigJam URL input (text field, validated to match figma.com/board/ or figma.com/figjam/ patterns)
- On submit:
  - Creates the .figjam JSON file in the vault at the appropriate path
  - Opens the newly created file
```

### 4. `settings.ts` — Plugin Settings

```
- Settings interface:
  - `defaultOpenInNewTab: boolean` — whether to open FigJam files in a new tab (default: true)
  - `showToolbar: boolean` — show reload/open-in-browser toolbar above webview (default: true)
  - `webviewPartition: string` — session partition name (default: "persist:figma")
```

### 5. File Explorer Integration

```
- Register a file-menu event:
  this.registerEvent(
    this.app.workspace.on("file-menu", (menu, file) => {
      if (file instanceof TFolder) {
        menu.addItem((item) => {
          item.setTitle("New FigJam board")
            .setIcon("layout-dashboard")
            .onClick(() => { /* open CreateFigJamModal with target folder */ });
        });
      }
    })
  );
```

## Project Structure

```
obsidian-figjam/
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs       # build config (from sample plugin)
├── styles.css                # webview container styling
├── src/
│   ├── main.ts               # plugin entry point
│   ├── FigJamView.ts         # custom view with webview
│   ├── CreateFigJamModal.ts  # modal for new figjam files
│   ├── settings.ts           # plugin settings tab
│   └── constants.ts          # view type, default settings, etc.
└── versions.json
```

## manifest.json

```json
{
  "id": "obsidian-figjam",
  "name": "FigJam",
  "version": "0.1.0",
  "minAppVersion": "1.0.0",
  "description": "Embed and edit FigJam boards as first-class files in your vault",
  "author": "Your Name",
  "isDesktopOnly": true
}
```

Note: `isDesktopOnly: true` is required because this depends on Electron's webview.

## Implementation Order (suggested)

1. **Proof of concept first**: Scaffold the plugin, create a minimal `ItemView` that tries to load `figma.com` in a `<webview>` tag. Verify it loads, you can log in, and you can edit. This is the make-or-break step.
2. **If webview works**: Implement the `.figjam` file registration and `FigJamView` to load URLs from file content.
3. **If webview doesn't work**: Try `<iframe>` as fallback. If that fails too, investigate `require('electron').remote.BrowserView` or similar approaches.
4. Add the `CreateFigJamModal` and commands.
5. Add file explorer context menu integration.
6. Add settings.
7. Polish: icons, error states, loading indicators, toolbar.

## Testing

- Create a test vault
- Place built plugin in `.obsidian/plugins/obsidian-figjam/`
- Use the `pjeby/hot-reload` community plugin for automatic reloading during development
- Open DevTools with Ctrl+Shift+I to debug
- Test with real FigJam URLs (you need a Figma account)

## Known Limitations to Document

- SSO/SAML authentication does not work inside Electron webviews (OAuth redirect issue). Users must use email/password login.
- Requires desktop Obsidian (Electron). Will not work on mobile.
- FigJam content is not stored locally — the `.figjam` file is just a URL pointer. No offline editing.
- Figma may change their web app in ways that break webview compatibility.

## Stretch Goals (future)

- Thumbnail preview generation for `.figjam` files in the file explorer
- Backlink support: parse FigJam sticky notes for `[[wiki-link]]` patterns via Figma API
- Embed FigJam boards inline in markdown notes (like how Obsidian embeds PDFs)
- Template FigJam boards: create new FigJam documents via Figma API instead of requiring a pre-existing URL
- Multiple Figma account support via different webview partitions