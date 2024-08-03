![Plugin installation](readme_assets/visual.png)

# Figma Dev Mode exporting to Aphrodite (styling engine)

This Figma plugin was made to streamline front end styling work, with quick copy-paste for the [Aphrodite](https://github.com/Khan/aphrodite) styling engine. It's also meant to map Figma variables/styles and value literals to common variables in your codebase (padding, size, position, colors... etc.) 

It functions in `Dev Mode,` replacing the default CSS output with an Aphrodite object shown above. 

## Installation

**Steps:**

1. Enter Dev Mode
1. Click the Plugins tab
1. Hit the plus button
1. Figma will prompt you to find the manifest file: `dist/manifest.json` 

![Plugin installation](readme_assets/figma_install.png)

## Get your edits running:
- `npm run bundleup`
- `npm run watch`
