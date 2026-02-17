# obsidian-figjam

Store and edit FigJam diagrams as first-class documents in your Obsidian vault

https://github.com/user-attachments/assets/16758caa-0eef-4f1b-9f98-d28f54c47d54

## Authentication

To view and edit FigJam boards, you will have to log into FigJam from Obsidian. You might need to enable the Webview core plugin for that.

Use email/password authentication to log in to FigJam. This works just fine and persists across Obsidian restarts.

**I could not make the FigJam SSO authentication work inside Electron webviews in Obsidian.** If you figure out how to make SSO work, please submit an issue/PR!

![](https://github.com/user-attachments/assets/8275b1b6-8b8d-4f1b-a714-1dd39250d565)

## Organizing FigJam diagram

FigJam documents in your vault can be parts of the same FigJam board &ndash; that's convenient so you can keep them all in the same space and keep using the free FigJam plan where you can only have a single project.

For that, use a link to a specific node when creating your Obsidian FigJam diagram:

1. Have a square section with nested elements on your FigJam board
2. Click on the section to select it - this changes the URL in your browser
3. Copy the URL
4. Create an Obsidian FigJam diagram in your vault with that URL
5. The document opens in Obsidian with that node fitting into your viewport


