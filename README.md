# JSON Lens Extension

JSON Lens is a Chromium extension for validating, formatting, folding, copying, and downloading JSON.

## Features

- Opens a full-page JSON workspace from the browser extension button.
- Accepts manual paste, clipboard text, and local `.json` or `.txt` files.
- Validates JSON and shows line, column, and nearby context for parse errors.
- Renders a formatted tree with line numbers.
- Collapses or expands individual nodes, all levels, or the whole tree.
- Copies the full formatted document or a specific node/value.
- Downloads the formatted result as a `.json` file.
- Supports English and Simplified Chinese UI text.

## Install Locally

1. Open Chrome or Edge.
2. Go to `chrome://extensions` or `edge://extensions`.
3. Enable developer mode.
4. Choose `Load unpacked`.
5. Select this project folder.
6. Click the JSON Lens extension button to open the formatter page.

## Development

Run the core tests:

```bash
npm test
```

The project intentionally uses plain Manifest V3 files and browser ES modules, so there is no build step.

## Release Pipeline

Pushes to `main` run `.github/workflows/release.yml`. The workflow runs tests, packages the unpacked extension files into `json-lens-extension-<version>.zip`, generates a changelog from git commits, and creates a GitHub Release with the zip attached.

## 中文说明

JSON Lens 是一个 Chromium 浏览器扩展，用于校验、格式化、折叠、复制和下载 JSON。

### 功能

- 点击扩展按钮打开完整工具页。
- 支持手动粘贴、读取剪贴板、选择本地 `.json` 或 `.txt` 文件。
- JSON 无效时显示错误、行列位置和附近内容。
- 格式化后以带行号的树形结构显示。
- 支持单个节点折叠/展开，也支持全部折叠/全部展开。
- 支持复制全部 JSON 或复制某个节点/值。
- 支持下载格式化后的 `.json` 文件。
- 支持英文和简体中文界面切换。

### 本地安装

1. 打开 Chrome 或 Edge。
2. 进入 `chrome://extensions` 或 `edge://extensions`。
3. 开启开发者模式。
4. 选择“加载已解压的扩展程序”。
5. 选择本项目文件夹。
6. 点击 JSON Lens 扩展按钮打开工具页。
