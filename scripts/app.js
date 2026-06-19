import {
  collectCollapsibleIds,
  createDownloadName,
  getVisibleRows,
  stringifyNodeValue
} from "./json-core.js";
import { getInitialLanguage, translate } from "./i18n.js";
import {
  addDocument,
  createWorkspace,
  formatDocument,
  getActiveDocument,
  hydrateWorkspace,
  markDocumentSaved,
  removeDocument,
  replaceDocument,
  selectDocument,
  updateDocumentSource,
  updateDocumentTitle
} from "./workspace-core.js";
import {
  clearStoredDocuments,
  loadStoredDocuments,
  saveStoredDocument
} from "./storage.js";

const AUTO_FORMAT_DELAY_MS = 300;

const elements = {
  statusText: document.querySelector("#statusText"),
  workspace: document.querySelector("#workspace"),
  documentTabs: document.querySelector("#documentTabs"),
  sourcePane: document.querySelector("#sourcePane"),
  sourceEditor: document.querySelector("#sourceEditor"),
  sourceInput: document.querySelector("#sourceInput"),
  sourceLineNumbers: document.querySelector("#sourceLineNumbers"),
  fileInput: document.querySelector("#fileInput"),
  fileMeta: document.querySelector("#fileMeta"),
  errorPanel: document.querySelector("#errorPanel"),
  errorTitle: document.querySelector("#errorTitle"),
  errorMessage: document.querySelector("#errorMessage"),
  errorExcerpt: document.querySelector("#errorExcerpt"),
  languageLabel: document.querySelector("#languageLabel"),
  languageSelect: document.querySelector("#languageSelect"),
  sourceTitle: document.querySelector("#sourceTitle"),
  resultTitle: document.querySelector("#resultTitle"),
  treeView: document.querySelector("#treeView"),
  resultMeta: document.querySelector("#resultMeta"),
  newDocumentButton: document.querySelector("#newDocumentButton"),
  readClipboardButton: document.querySelector("#readClipboardButton"),
  chooseFileButton: document.querySelector("#chooseFileButton"),
  formatButton: document.querySelector("#formatButton"),
  saveButton: document.querySelector("#saveButton"),
  copyAllButton: document.querySelector("#copyAllButton"),
  downloadButton: document.querySelector("#downloadButton"),
  toggleSourceButton: document.querySelector("#toggleSourceButton"),
  clearButton: document.querySelector("#clearButton"),
  clearCacheButton: document.querySelector("#clearCacheButton"),
  collapseAllButton: document.querySelector("#collapseAllButton"),
  expandAllButton: document.querySelector("#expandAllButton")
};

const state = {
  language: getInitialLanguage(localStorage.getItem("jsonLensLanguage"), navigator.language),
  workspace: createWorkspace(),
  sourceVisible: localStorage.getItem("jsonLensSourceVisible") !== "false",
  autoFormatTimer: null
};

init();

async function init() {
  bindEvents();
  applyLanguage();

  try {
    const records = await loadStoredDocuments();
    state.workspace = hydrateWorkspace(records, localStorage.getItem("jsonLensActiveId"));
    renderAll(records.length > 0 ? t("loadedSaved") : t("ready"));
  } catch {
    renderAll(t("loadFailed"));
  }
}

function bindEvents() {
  elements.languageSelect.addEventListener("change", () => {
    state.language = elements.languageSelect.value;
    localStorage.setItem("jsonLensLanguage", state.language);
    applyLanguage();
    renderAll();
  });

  elements.documentTabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-document-id]");
    if (!tab) return;

    const action = event.target.closest("[data-action]")?.dataset.action;
    const documentId = tab.dataset.documentId;

    if (action === "close") {
      state.workspace = removeDocument(state.workspace, documentId);
    } else {
      state.workspace = selectDocument(state.workspace, documentId);
    }

    localStorage.setItem("jsonLensActiveId", state.workspace.activeId);
    renderAll();
  });

  elements.documentTabs.addEventListener("dblclick", (event) => {
    const tab = event.target.closest("[data-document-id]");
    if (!tab) return;

    const document = state.workspace.documents.find((item) => item.id === tab.dataset.documentId);
    if (!document) return;

    const title = prompt(t("renamePrompt"), document.title);
    if (title == null) return;

    state.workspace = replaceDocument(state.workspace, updateDocumentTitle(document, title));
    renderAll();
  });

  elements.sourceInput.addEventListener("input", () => {
    const document = updateDocumentSource(getActiveDocument(state.workspace), elements.sourceInput.value);
    state.workspace = replaceDocument(state.workspace, document);
    updateSourceLineNumbers();
    setStatus(t("autoFormatting"));
    scheduleAutoFormat();
  });

  elements.sourceInput.addEventListener("scroll", () => {
    elements.sourceLineNumbers.scrollTop = elements.sourceInput.scrollTop;
  });

  elements.sourceInput.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      formatActiveDocument({ focusError: true });
    }
  });

  elements.newDocumentButton.addEventListener("click", addNewDocument);
  elements.readClipboardButton.addEventListener("click", readClipboard);
  elements.chooseFileButton.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", readSelectedFile);
  elements.formatButton.addEventListener("click", () => formatActiveDocument({ focusError: true }));
  elements.saveButton.addEventListener("click", saveActiveDocument);
  elements.copyAllButton.addEventListener("click", copyAll);
  elements.downloadButton.addEventListener("click", downloadFormattedJson);
  elements.toggleSourceButton.addEventListener("click", toggleSource);
  elements.clearButton.addEventListener("click", clearCurrentDocument);
  elements.clearCacheButton.addEventListener("click", clearCache);
  elements.collapseAllButton.addEventListener("click", collapseAll);
  elements.expandAllButton.addEventListener("click", expandAll);
  elements.treeView.addEventListener("click", handleTreeClick);
}

function addNewDocument() {
  state.workspace = addDocument(state.workspace);
  localStorage.setItem("jsonLensActiveId", state.workspace.activeId);
  renderAll(t("ready"));
  elements.sourceInput.focus();
}

async function readClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    updateActiveSource(text, "clipboard", t("clipboardMeta"));
    setStatus(t("clipboardLoaded"));
    formatActiveDocument();
  } catch {
    showSoftError(t("clipboardUnavailable"));
  }
}

function readSelectedFile() {
  const [file] = elements.fileInput.files;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const source = String(reader.result ?? "");
    const document = updateDocumentTitle(
      updateDocumentSource(getActiveDocument(state.workspace), source, file.name),
      file.name.replace(/\.[^.]+$/, "")
    );
    state.workspace = replaceDocument(state.workspace, document);
    elements.fileMeta.textContent = t("fileMetaLoaded", { name: file.name, size: formatBytes(file.size) });
    renderAll(t("fileLoaded"));
    formatActiveDocument();
  };
  reader.onerror = () => showSoftError(t("fileReadFailed"));
  reader.readAsText(file);
}

function updateActiveSource(source, sourceName, metaText) {
  const document = updateDocumentSource(getActiveDocument(state.workspace), source, sourceName);
  state.workspace = replaceDocument(state.workspace, document);
  elements.fileMeta.textContent = metaText;
  renderAll();
}

function scheduleAutoFormat() {
  window.clearTimeout(state.autoFormatTimer);
  state.autoFormatTimer = window.setTimeout(() => {
    formatActiveDocument();
  }, AUTO_FORMAT_DELAY_MS);
}

function formatActiveDocument(options = {}) {
  window.clearTimeout(state.autoFormatTimer);

  const active = getActiveDocument(state.workspace);
  const formatted = formatDocument(active);
  state.workspace = replaceDocument(state.workspace, formatted);
  renderAll(formatted.isValid === false ? t("formatError") : t("jsonFormatted"));

  if (formatted.isValid === false && options.focusError && formatted.parseError?.position != null) {
    elements.sourceInput.focus();
    elements.sourceInput.setSelectionRange(formatted.parseError.position, formatted.parseError.position);
  }
}

async function saveActiveDocument() {
  try {
    const saved = markDocumentSaved(getActiveDocument(state.workspace));
    await saveStoredDocument(saved);
    state.workspace = replaceDocument(state.workspace, saved);
    renderAll(t("saved"));
  } catch {
    showSoftError(t("saveFailed"));
  }
}

async function clearCache() {
  if (!confirm(t("clearCacheConfirm"))) return;

  try {
    await clearStoredDocuments();
    state.workspace = createWorkspace();
    localStorage.removeItem("jsonLensActiveId");
    renderAll(t("cacheCleared"));
  } catch {
    showSoftError(t("clearCacheFailed"));
  }
}

function clearCurrentDocument() {
  const cleared = formatDocument(updateDocumentSource(getActiveDocument(state.workspace), ""));
  state.workspace = replaceDocument(state.workspace, cleared);
  elements.fileInput.value = "";
  renderAll(t("workspaceCleared"));
}

function renderAll(statusMessage = null) {
  applyLanguage();
  renderTabs();
  renderSource();
  renderTree();

  if (statusMessage) {
    setStatus(statusMessage);
  } else {
    updateStatusForActiveDocument();
  }
}

function renderTabs() {
  elements.documentTabs.replaceChildren();

  state.workspace.documents.forEach((jsonDocument) => {
    const tab = window.document.createElement("button");
    tab.type = "button";
    tab.className = `document-tab${jsonDocument.id === state.workspace.activeId ? " active" : ""}${jsonDocument.isValid === false ? " invalid" : ""}`;
    tab.dataset.documentId = jsonDocument.id;
    tab.title = jsonDocument.title;

    const label = window.document.createElement("span");
    label.className = "document-tab-title";
    label.textContent = jsonDocument.title;

    const close = window.document.createElement("span");
    close.className = "document-tab-close";
    close.dataset.action = "close";
    close.title = t("closeDocument");
    close.textContent = "x";

    tab.append(label, close);
    elements.documentTabs.append(tab);
  });
}

function renderSource() {
  const document = getActiveDocument(state.workspace);
  elements.workspace.classList.toggle("source-hidden", !state.sourceVisible);
  elements.sourcePane.hidden = !state.sourceVisible;
  elements.sourceEditor.classList.toggle("invalid", document.isValid === false);
  elements.sourceInput.value = document.source;
  elements.fileMeta.textContent = document.sourceName ? document.sourceName : t("sourceHint");
  elements.toggleSourceButton.textContent = state.sourceVisible ? t("hideSource") : t("showSource");
  updateSourceLineNumbers();
  renderError(document);
}

function renderError(document) {
  if (document.isValid !== false || !document.parseError) {
    hideError();
    return;
  }

  const result = document.parseError;
  const location = result.line && result.column ? ` ${t("lineColumn", { line: result.line, column: result.column })}` : "";
  elements.errorTitle.textContent = t("invalidJson");
  elements.errorMessage.textContent = `${result.message}.${location}`;
  elements.errorExcerpt.textContent = result.excerpt || "";
  elements.errorPanel.hidden = false;
}

function renderTree() {
  elements.treeView.replaceChildren();

  const document = getActiveDocument(state.workspace);
  const hasTree = Boolean(document.tree);
  elements.copyAllButton.disabled = !hasTree;
  elements.downloadButton.disabled = !hasTree;
  elements.collapseAllButton.disabled = !hasTree;
  elements.expandAllButton.disabled = !hasTree;

  if (!hasTree) {
    const empty = window.document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = t("resultEmpty");
    elements.treeView.append(empty);
    elements.resultMeta.textContent = t("resultEmptyMeta");
    return;
  }

  const nodeById = indexNodes(document.tree);
  const rows = getVisibleRows(document.tree, document.collapsedIds);
  const fragment = window.document.createDocumentFragment();

  rows.forEach((row) => {
    const rowElement = window.document.createElement("div");
    rowElement.className = `tree-row type-${row.type}`;
    rowElement.dataset.nodeId = row.id;

    const line = window.document.createElement("div");
    line.className = "row-line";
    line.textContent = String(row.lineNumber);

    const toggle = window.document.createElement("button");
    toggle.className = "toggle";
    toggle.type = "button";
    toggle.disabled = !row.isCollapsible;
    toggle.dataset.action = "toggle";
    toggle.dataset.nodeId = row.id;
    toggle.textContent = row.isCollapsible ? (row.isCollapsed ? "+" : "-") : "";
    toggle.title = row.isCollapsed ? t("expandNode") : t("collapseNode");

    const key = window.document.createElement("div");
    key.className = "key";
    key.style.paddingLeft = `${row.depth * 16}px`;
    key.textContent = formatKey(row);
    key.title = key.textContent;

    const type = window.document.createElement("div");
    type.className = "type-pill";
    type.textContent = row.type;

    const value = window.document.createElement("div");
    value.className = "value";
    value.textContent = row.summary;
    value.title = row.summary;

    const copy = window.document.createElement("button");
    copy.className = "row-copy";
    copy.type = "button";
    copy.dataset.action = "copy";
    copy.dataset.nodeId = row.id;
    copy.textContent = t("copy");
    copy.title = t("copyNode");

    rowElement.append(line, toggle, key, type, value, copy);
    fragment.append(rowElement);
  });

  elements.treeView.dataset.nodeCount = String(nodeById.size);
  elements.treeView.append(fragment);
  elements.resultMeta.textContent = t("visibleRows", {
    visible: rows.length,
    lines: document.formatted.split("\n").length
  });
}

function handleTreeClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const document = getActiveDocument(state.workspace);
  const nodeId = button.dataset.nodeId;
  const action = button.dataset.action;

  if (action === "toggle") {
    const collapsedIds = new Set(document.collapsedIds);
    if (collapsedIds.has(nodeId)) {
      collapsedIds.delete(nodeId);
    } else {
      collapsedIds.add(nodeId);
    }
    state.workspace = replaceDocument(state.workspace, { ...document, collapsedIds });
    renderTree();
  }

  if (action === "copy") {
    const node = indexNodes(document.tree).get(nodeId);
    if (node) {
      copyText(stringifyNodeValue(node), t("copiedNode"));
    }
  }
}

function collapseAll() {
  const document = getActiveDocument(state.workspace);
  if (!document.tree) return;

  state.workspace = replaceDocument(state.workspace, {
    ...document,
    collapsedIds: new Set(collectCollapsibleIds(document.tree))
  });
  renderTree();
  setStatus(t("allCollapsed"));
}

function expandAll() {
  const document = getActiveDocument(state.workspace);
  state.workspace = replaceDocument(state.workspace, {
    ...document,
    collapsedIds: new Set()
  });
  renderTree();
  setStatus(t("allExpanded"));
}

function copyAll() {
  copyText(getActiveDocument(state.workspace).formatted, t("copiedAll"));
}

function downloadFormattedJson() {
  const document = getActiveDocument(state.workspace);
  const blob = new Blob([document.formatted], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = createDownloadName(document.sourceName || `${document.title}.json`);
  window.document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(t("downloadPrepared"));
}

function toggleSource() {
  state.sourceVisible = !state.sourceVisible;
  localStorage.setItem("jsonLensSourceVisible", String(state.sourceVisible));
  renderAll();
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(successMessage);
  } catch {
    showSoftError(t("copyBlocked"));
  }
}

function showSoftError(message) {
  elements.errorMessage.textContent = message;
  elements.errorExcerpt.textContent = "";
  elements.errorPanel.hidden = false;
  elements.errorTitle.textContent = t("actionNeedsAttention");
  setStatus(t("actionNeedsAttention"));
}

function hideError() {
  elements.errorPanel.hidden = true;
  elements.errorMessage.textContent = "";
  elements.errorExcerpt.textContent = "";
}

function updateStatusForActiveDocument() {
  const document = getActiveDocument(state.workspace);
  if (document.isValid === false) {
    setStatus(t("formatError"));
  } else if (document.isValid === true) {
    setStatus(t("jsonFormatted"));
  } else {
    setStatus(t("ready"));
  }
}

function setStatus(message) {
  elements.statusText.textContent = message;
}

function updateSourceLineNumbers() {
  const lineCount = Math.max(1, elements.sourceInput.value.split("\n").length);
  elements.sourceLineNumbers.textContent = Array.from({ length: lineCount }, (_, index) => index + 1).join("\n");
}

function applyLanguage() {
  elements.languageSelect.value = state.language;
  window.document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  elements.sourceTitle.textContent = t("sourceTitle");
  elements.resultTitle.textContent = t("resultTitle");
  elements.languageLabel.textContent = t("languageLabel");
  elements.sourceInput.placeholder = t("placeholder");
  elements.newDocumentButton.textContent = t("newTab");
  elements.readClipboardButton.textContent = t("readClipboard");
  elements.chooseFileButton.textContent = t("openFile");
  elements.formatButton.textContent = t("format");
  elements.saveButton.textContent = t("save");
  elements.copyAllButton.textContent = t("copyAll");
  elements.downloadButton.textContent = t("download");
  elements.clearButton.textContent = t("clear");
  elements.clearCacheButton.textContent = t("clearCache");
  elements.collapseAllButton.textContent = t("collapseAll");
  elements.expandAllButton.textContent = t("expandAll");
  elements.toggleSourceButton.textContent = state.sourceVisible ? t("hideSource") : t("showSource");
  elements.errorTitle.textContent = t("invalidJson");
}

function t(key, values) {
  return translate(state.language, key, values);
}

function indexNodes(tree) {
  const map = new Map();

  function walk(node) {
    map.set(node.id, node);
    node.children.forEach(walk);
  }

  if (tree) walk(tree);
  return map;
}

function formatKey(row) {
  if (row.id === "root") return "root";
  if (typeof row.key === "number") return `[${row.key}]`;
  return JSON.stringify(row.key);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
