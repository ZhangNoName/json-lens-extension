# JSON Lens Extension Design

## Product

Build a Chromium Manifest V3 extension named `json-lens-extension`. Clicking the extension action opens a full tab tool for validating, formatting, inspecting, copying, and downloading JSON.

## Requirements

- Open the JSON tool when the browser extension icon is clicked.
- Accept JSON from manual paste, clipboard read, or local file selection.
- Validate input before rendering and show clear errors with line, column, and nearby text when possible.
- Auto-format while editing with a short debounce so normal editing remains responsive.
- Preserve the last successful formatted result when the current source becomes invalid.
- Show an invalid border around the source editor and a header status message when formatting fails.
- Render formatted JSON in a readable developer-tool UI.
- Show line numbers for rendered rows.
- Allow individual object and array nodes to collapse or expand.
- Provide buttons to collapse all levels and expand all levels.
- Support multiple JSON documents in one page through document tabs.
- Allow the source editor pane to be hidden and shown.
- Save documents to IndexedDB when the user clicks Save.
- Load saved IndexedDB documents when the page opens.
- Clear all IndexedDB documents after an irreversible confirmation.
- Allow copying all formatted JSON.
- Allow copying a specific node or primitive value.
- Allow downloading the formatted JSON as a `.json` file.
- Support English and Simplified Chinese UI text with an in-page language switcher.
- Use an English project name and repository name.
- Keep the project easy to load as an unpacked Chrome or Edge extension.
- Add a GitHub Actions pipeline that runs when `main` changes, packages the extension as a release zip, creates a GitHub Release, and includes a generated changelog.

## Architecture

The extension uses a simple no-build architecture: `manifest.json`, a service worker, one app page, CSS, and browser ES modules. Core JSON behavior lives in `scripts/json-core.js` so it can be tested with Node and reused by the UI.

The background service worker listens for action clicks and opens `app.html` in a new tab. The app page owns input, file loading, clipboard access, rendering, collapse state, copy actions, and download creation.

## UI

The page is a compact two-pane workspace:

- Header toolbar: app name, validation status, language switcher, new document, read clipboard, load file, format, save, clear, clear cache, copy all, download, hide/show source.
- Document tabs: one tab per JSON document, with invalid tabs marked when their current source does not parse.
- Left pane: source textarea and file metadata.
- Right pane: formatted JSON tree with row numbers, collapsible rows, node type labels, and per-row copy buttons.
- Error panel: parse error message, line/column, and context excerpt.

The visual style should be calm and tool-like: neutral backgrounds, readable monospace content, restrained accent colors, tight spacing, and clear focus states.

All primary labels and runtime messages should be available in English and Simplified Chinese. The app should default to Chinese when the browser language starts with `zh`; otherwise it should default to English. The user's manual selection should be stored locally.

## Data Flow

1. User provides text manually, via clipboard, or via file.
2. The active document source updates immediately, then auto-format runs after a 300 ms debounce.
3. `formatDocument` validates JSON and either updates the formatted output/tree or stores parse error metadata while preserving the previous valid result.
4. `buildJsonTree` converts parsed JSON into stable node records.
5. The UI renders visible rows from the tree and the current collapsed node set.
6. Save writes the active document source metadata to IndexedDB.
7. Copy/download actions use `stringifyNodeValue` or the full formatted output.

## Error Handling

Invalid JSON does not replace the previous successful output. The UI keeps the source text visible, marks the source editor red, updates the header status, and shows an error panel. Clipboard, file, save, load, and cache-clear errors show short user-facing messages without exposing implementation details.

## Performance

The app performs JSON parsing and tree building after a 300 ms debounce instead of on every keystroke. For small and medium documents this keeps the UI feeling live. Preserving the previous valid tree avoids unnecessary blank states during invalid intermediate edits. If future usage requires very large files, the next architectural step is moving parse/tree generation to a Web Worker.

## Testing

Use Node's built-in test runner for core modules. Cover successful parse/format, invalid JSON line and column extraction, tree building, visible row generation with collapse state, node copy text, download filename generation, language message lookup, multi-document workspace behavior, source update behavior, result preservation after invalid edits, removal behavior, and serialization/hydration for IndexedDB records.
