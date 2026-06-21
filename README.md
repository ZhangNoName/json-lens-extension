# JSON Lens Extension

<p align="center">
  <strong>Language</strong>:
  <a href="#english">English</a>
  |
  <a href="#中文">中文</a>
</p>

<details open>
<summary id="english"><strong>English</strong></summary>

## Overview

JSON Lens is a Chromium extension for validating, formatting, folding, copying, saving, and downloading JSON.

## Features

- Opens a full-page JSON workspace from the browser extension button.
- Accepts manual paste, clipboard text, and local `.json` or `.txt` files.
- Validates JSON and shows line, column, and nearby context for parse errors.
- Renders a formatted tree with line numbers.
- Collapses or expands individual nodes, all levels, or the whole tree.
- Auto-formats while editing with a short debounce.
- Pauses auto-format for large sources and keeps manual formatting available.
- Keeps the last valid formatted result visible when the current edit is invalid.
- Supports multiple JSON documents with document tabs.
- Creates a new document from the tab bar and renames tabs by double-clicking.
- Hides or shows the source editor.
- Optionally syncs source and result scrolling with a checkbox.
- Keeps per-row copy controls hidden until hover/focus, and supports right-click copying on result rows.
- Saves JSON documents to IndexedDB and restores them on the next open.
- Clears all local JSON cache after an irreversible confirmation.
- Copies the full formatted document or a specific node/value.
- Downloads the formatted result as a `.json` file.
- Checks GitHub Releases on open and prompts when a newer version is available.
- Supports English and Simplified Chinese UI text.

## Install Locally

1. Download the release zip from GitHub Releases.
2. Extract the zip to a stable local folder.
3. Open Chrome or Edge.
4. Go to `chrome://extensions` or `edge://extensions`.
5. Enable developer mode.
6. Choose `Load unpacked`.
7. Select the extracted folder that contains `manifest.json`.
8. Click the JSON Lens extension button to open the formatter page.

## Development

Run the tests:

```bash
npm test
```

The project intentionally uses plain Manifest V3 files and browser ES modules, so there is no build step.

## Updates

When JSON Lens opens, it checks the latest GitHub Release. If the release version is newer than the installed extension version, it asks whether to open the release download page. Locally loaded unpacked extensions cannot overwrite themselves automatically, so update by downloading the new zip, extracting it, and reloading the unpacked extension folder in `chrome://extensions` or `edge://extensions`.

## Performance Notes

JSON Lens auto-formats after a 300 ms editing debounce for normal-size JSON. When the source is larger than 1 MB, auto-format pauses to avoid repeated parsing and tree rebuilding while typing. The Format button still works on large JSON, and large formatted trees start collapsed by default so the first render stays lighter.

For very large source text, the source line-number gutter is capped instead of rendering thousands of DOM text lines. Invalid edits still keep the previous valid tree on screen, so the result area does not disappear while editing.

The next performance step for tens-of-MB files is moving parse/tree work into a Web Worker and adding progressive tree rendering.

## Release Pipeline

Pushes to `main` run `.github/workflows/release.yml`. The workflow runs tests, packages the unpacked extension files into `json-lens-extension-<version>.zip`, generates release notes in English and Chinese from git commits, and creates a GitHub Release with the zip attached.

</details>

<details>
<summary id="中文"><strong>中文</strong></summary>

## 概览

JSON Lens 是一个 Chromium 浏览器扩展，用来校验、格式化、折叠、复制、保存和下载 JSON。

## 功能

- 点击扩展按钮后打开完整的 JSON 工作台页面。
- 支持手动粘贴、读取剪贴板、选择本地 `.json` 或 `.txt` 文件。
- JSON 无效时显示错误、行列位置和附近内容。
- 格式化后以带行号的树形结构展示。
- 支持单个节点折叠/展开，也支持全部折叠/全部展开。
- 编辑时通过短延迟自动格式化。
- 大文件会暂停自动格式化，但仍然可以手动点击格式化。
- 当前编辑内容无效时，右侧保留上一次正确格式化结果。
- 支持多个 JSON 文档，通过 tab 切换。
- 支持从 tab 栏新建文档，双击 tab 名称即可重命名。
- 支持隐藏或显示左侧源代码编辑区。
- 支持通过勾选框开启左右两侧同步滚动。
- 右侧逐行复制按钮默认隐藏，悬浮/聚焦时显示，也支持右键复制结果行。
- 支持把 JSON 文档保存到 IndexedDB，下次打开自动读取。
- 支持确认后清空所有本地 JSON 缓存，操作不可恢复。
- 支持复制全部 JSON 或复制某个节点/值。
- 支持下载格式化后的 `.json` 文件。
- 每次打开时检查 GitHub Release，有新版本时提示是否打开下载页。
- 支持英文和简体中文界面切换。

## 本地安装

1. 从 GitHub Releases 下载发布包 zip。
2. 将 zip 解压到一个固定的本地文件夹。
3. 打开 Chrome 或 Edge。
4. 进入 `chrome://extensions` 或 `edge://extensions`。
5. 开启开发者模式。
6. 点击“加载已解压的扩展程序”。
7. 选择解压后包含 `manifest.json` 的文件夹。
8. 点击 JSON Lens 扩展按钮打开工具页。

## 开发

运行测试：

```bash
npm test
```

项目使用原生 Manifest V3 文件和浏览器 ES modules，不需要构建步骤。

## 更新

JSON Lens 打开时会检查最新的 GitHub Release。如果发布版本高于当前安装版本，会询问是否打开发布下载页。本地“加载已解压”的扩展无法自动覆盖自身文件，所以更新方式是下载新的 zip、解压后，在 `chrome://extensions` 或 `edge://extensions` 中重新加载对应扩展文件夹。

## 性能说明

普通大小的 JSON 会在编辑停止约 300 ms 后自动格式化。当源内容超过 1 MB 时，自动格式化会暂停，避免在输入过程中反复解析和重建树。此时仍然可以点击“格式化”按钮手动处理，大 JSON 格式化完成后会默认折叠全部层级，让首次渲染更轻。

对于特别大的源文本，左侧行号不会继续渲染成千上万行，而是使用上限显示。当前编辑内容无效时，右侧仍然保留上一次正确结果，避免编辑过程中结果区频繁清空。

如果后续要处理几十 MB 级别文件，下一步会把解析和树构建移到 Web Worker，并加入渐进式树渲染。

## 发布流水线

每次推送到 `main` 都会运行 `.github/workflows/release.yml`。流水线会运行测试、把扩展文件打包成 `json-lens-extension-<version>.zip`、根据 git 提交生成中英双语发布说明，并创建带 zip 附件的 GitHub Release。

</details>
