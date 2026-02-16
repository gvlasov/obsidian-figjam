# obsidian-figjam

Makes FigJam boards first-class citizens in your Obsidian vault

https://github.com/user-attachments/assets/bb1242a0-121d-4aaf-8c0d-9b8564ad4595

## Authentication

To view and edit FigJam boards, you will have to log into FigJam from Obsidian. You might need to enable the Webview core plugin for that.

**I could not make the FigJam SSO authentication work inside Electron webviews in Obsidian.** But email/password login works just fine and persists across Obsidian restarts.

![](https://github.com/user-attachments/assets/8275b1b6-8b8d-4f1b-a714-1dd39250d565)

If you figure out how to make SSO work, please submit an issue/PR!

## Organizing FigJam documents

FigJam documents in your vault can be parts of the same FigJam board &ndash; that's convenient so you can keep them all in the same space and keep using the free FigJam plan where you can only have a single project.

1. Click on an element on your FigJam board in a web browser, e.g., a square section with nested elements
2. Browser page changes the URL for that specific node
3. Copy the URL
4. Import it into your Obsidian vault
5. The document opens in Obsidian with that node fitting into your viewport


