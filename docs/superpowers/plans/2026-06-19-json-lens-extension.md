# JSON Lens Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a bilingual Chromium extension that validates, formats, folds, copies, and downloads JSON, with an automatic GitHub release pipeline.

**Architecture:** Use a no-build Manifest V3 extension with a service worker that opens a full-tab tool page. Keep all testable JSON behavior in `scripts/json-core.js`; keep language text in `scripts/i18n.js`; keep browser-only DOM and clipboard/file/download behavior in `scripts/app.js`.

**Tech Stack:** Chromium Manifest V3, vanilla HTML/CSS/JavaScript ES modules, Node built-in test runner, GitHub CLI for publishing.

---

### Task 1: Core Tests

**Files:**
- Create: `package.json`
- Create: `tests/json-core.test.js`
- Create: `tests/i18n.test.js`

- [ ] **Step 1: Write failing tests for core JSON behavior**

Create `tests/json-core.test.js` with tests that import `scripts/json-core.js` and assert parse, error location, tree, collapse, copy, and filename behavior. Create `tests/i18n.test.js` with tests that assert language normalization, fallback, and key lookup.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL because `scripts/json-core.js` does not exist yet.

### Task 2: Core Module

**Files:**
- Create: `scripts/json-core.js`
- Create: `scripts/i18n.js`

- [ ] **Step 1: Implement parse and tree helpers**

Create exported JSON functions: `parseJsonInput`, `buildJsonTree`, `getVisibleRows`, `collectCollapsibleIds`, `stringifyNodeValue`, and `createDownloadName`. Create exported i18n functions: `normalizeLanguage`, `getInitialLanguage`, `translate`, and `getMessages`.

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test`
Expected: PASS for all core tests.

### Task 3: Extension Shell

**Files:**
- Create: `manifest.json`
- Create: `background.js`
- Create: `app.html`
- Create: `styles/app.css`
- Create: `scripts/app.js`
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create Manifest V3 shell**

Add extension metadata, action click handling, clipboard permission, and the app page.

- [ ] **Step 2: Implement the UI**

Wire textarea input, clipboard read, file open, validation, JSON tree rendering, row copy buttons, collapse all, expand all, copy all, clear, download, and English/Chinese language switching.

- [ ] **Step 3: Run tests and inspect files**

Run: `npm test`
Expected: PASS. Confirm the manifest, app files, and release workflow exist.

### Task 4: Documentation and Publishing

**Files:**
- Create: `README.md`

- [ ] **Step 1: Document installation and usage**

Explain how to load the unpacked extension, switch languages, use clipboard/file input, fold rows, copy content, download formatted JSON, and understand the release workflow.

- [ ] **Step 2: Verify GitHub CLI and repository state**

Run: `gh --version`, `gh auth status`, `git status -sb`, and inspect remotes.

- [ ] **Step 3: Commit and push**

If no GitHub remote exists, create or connect a repository named `json-lens-extension`, ensure the default branch can be `main`, commit the project, and push branch `codex/json-lens-extension`.

- [ ] **Step 4: Open a draft PR when a suitable base branch exists**

Use GitHub CLI or the GitHub app to create a draft PR if the remote has a base branch. If this is the first commit on a new repository, push `main` so the release workflow can run on future main changes.

## Self-Review

- Spec coverage: each required input, validation, rendering, folding, copy, download, bilingual UI, extension launch, English naming, GitHub publishing, and release pipeline requirement maps to a task.
- Placeholder scan: no TBD or TODO placeholders remain.
- Type consistency: function names are consistent across tests, implementation, and app wiring.
