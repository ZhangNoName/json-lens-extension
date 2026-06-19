import {
  buildJsonTree,
  collectCollapsibleIds,
  createDownloadName,
  getVisibleRows,
  parseJsonInput,
  stringifyNodeValue
} from "./json-core.js";
import { getInitialLanguage, translate } from "./i18n.js";

const elements = {
  statusText: document.querySelector("#statusText"),
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
  readClipboardButton: document.querySelector("#readClipboardButton"),
  chooseFileButton: document.querySelector("#chooseFileButton"),
  formatButton: document.querySelector("#formatButton"),
  copyAllButton: document.querySelector("#copyAllButton"),
  downloadButton: document.querySelector("#downloadButton"),
  clearButton: document.querySelector("#clearButton"),
  collapseAllButton: document.querySelector("#collapseAllButton"),
  expandAllButton: document.querySelector("#expandAllButton")
};

const state = {
  language: getInitialLanguage(localStorage.getItem("jsonLensLanguage"), navigator.language),
  sourceName: "",
  formatted: "",
  tree: null,
  collapsedIds: new Set(),
  nodeById: new Map()
};

elements.languageSelect.addEventListener("change", () => {
  state.language = elements.languageSelect.value;
  localStorage.setItem("jsonLensLanguage", state.language);
  applyLanguage();
  renderTree();
});

elements.sourceInput.addEventListener("input", () => {
  updateSourceLineNumbers();
  setStatus(t("editing"));
});

elements.sourceInput.addEventListener("scroll", () => {
  elements.sourceLineNumbers.scrollTop = elements.sourceInput.scrollTop;
});

elements.sourceInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    formatSource();
  }
});

elements.readClipboardButton.addEventListener("click", readClipboard);
elements.chooseFileButton.addEventListener("click", () => elements.fileInput.click());
elements.fileInput.addEventListener("change", readSelectedFile);
elements.formatButton.addEventListener("click", formatSource);
elements.copyAllButton.addEventListener("click", copyAll);
elements.downloadButton.addEventListener("click", downloadFormattedJson);
elements.clearButton.addEventListener("click", clearWorkspace);
elements.collapseAllButton.addEventListener("click", collapseAll);
elements.expandAllButton.addEventListener("click", expandAll);
elements.treeView.addEventListener("click", handleTreeClick);

updateSourceLineNumbers();
applyLanguage();

async function readClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    elements.sourceInput.value = text;
    state.sourceName = "clipboard";
    elements.fileMeta.textContent = t("clipboardMeta");
    updateSourceLineNumbers();
    setStatus(t("clipboardLoaded"));
    formatSource();
  } catch {
    showSoftError(t("clipboardUnavailable"));
  }
}

function readSelectedFile() {
  const [file] = elements.fileInput.files;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    elements.sourceInput.value = String(reader.result ?? "");
    state.sourceName = file.name;
    elements.fileMeta.textContent = t("fileMetaLoaded", { name: file.name, size: formatBytes(file.size) });
    updateSourceLineNumbers();
    setStatus(t("fileLoaded"));
    formatSource();
  };
  reader.onerror = () => showSoftError(t("fileReadFailed"));
  reader.readAsText(file);
}

function formatSource() {
  const source = elements.sourceInput.value;
  const result = parseJsonInput(source);

  if (!result.ok) {
    state.formatted = "";
    state.tree = null;
    state.nodeById.clear();
    state.collapsedIds.clear();
    renderTree();
    showParseError(result);
    if (result.position != null) {
      elements.sourceInput.focus();
      elements.sourceInput.setSelectionRange(result.position, result.position);
    }
    return;
  }

  state.formatted = result.formatted;
  state.tree = buildJsonTree(result.data);
  state.nodeById = indexNodes(state.tree);
  state.collapsedIds.clear();
  hideError();
  renderTree();
  setStatus(t("jsonFormatted"));
}

function renderTree() {
  elements.treeView.replaceChildren();

  const hasTree = Boolean(state.tree);
  elements.copyAllButton.disabled = !hasTree;
  elements.downloadButton.disabled = !hasTree;
  elements.collapseAllButton.disabled = !hasTree;
  elements.expandAllButton.disabled = !hasTree;

  if (!hasTree) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = t("resultEmpty");
    elements.treeView.append(empty);
    elements.resultMeta.textContent = t("resultEmptyMeta");
    return;
  }

  const rows = getVisibleRows(state.tree, state.collapsedIds);
  const fragment = document.createDocumentFragment();

  rows.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = `tree-row type-${row.type}`;
    rowElement.dataset.nodeId = row.id;

    const line = document.createElement("div");
    line.className = "row-line";
    line.textContent = String(row.lineNumber);

    const toggle = document.createElement("button");
    toggle.className = "toggle";
    toggle.type = "button";
    toggle.disabled = !row.isCollapsible;
    toggle.dataset.action = "toggle";
    toggle.dataset.nodeId = row.id;
    toggle.textContent = row.isCollapsible ? (row.isCollapsed ? "+" : "-") : "";
    toggle.title = row.isCollapsed ? t("expandNode") : t("collapseNode");

    const key = document.createElement("div");
    key.className = "key";
    key.style.paddingLeft = `${row.depth * 16}px`;
    key.textContent = formatKey(row);
    key.title = key.textContent;

    const type = document.createElement("div");
    type.className = "type-pill";
    type.textContent = row.type;

    const value = document.createElement("div");
    value.className = "value";
    value.textContent = row.summary;
    value.title = row.summary;

    const copy = document.createElement("button");
    copy.className = "row-copy";
    copy.type = "button";
    copy.dataset.action = "copy";
    copy.dataset.nodeId = row.id;
    copy.textContent = t("copy");
    copy.title = t("copyNode");

    rowElement.append(line, toggle, key, type, value, copy);
    fragment.append(rowElement);
  });

  elements.treeView.append(fragment);
  elements.resultMeta.textContent = t("visibleRows", {
    visible: rows.length,
    lines: state.formatted.split("\n").length
  });
}

function handleTreeClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const nodeId = button.dataset.nodeId;
  const action = button.dataset.action;

  if (action === "toggle") {
    if (state.collapsedIds.has(nodeId)) {
      state.collapsedIds.delete(nodeId);
    } else {
      state.collapsedIds.add(nodeId);
    }
    renderTree();
  }

  if (action === "copy") {
    const node = state.nodeById.get(nodeId);
    if (node) {
      copyText(stringifyNodeValue(node), t("copiedNode"));
    }
  }
}

function collapseAll() {
  if (!state.tree) return;
  state.collapsedIds = new Set(collectCollapsibleIds(state.tree));
  renderTree();
  setStatus(t("allCollapsed"));
}

function expandAll() {
  state.collapsedIds.clear();
  renderTree();
  setStatus(t("allExpanded"));
}

function copyAll() {
  copyText(state.formatted, t("copiedAll"));
}

function downloadFormattedJson() {
  const blob = new Blob([state.formatted], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = createDownloadName(state.sourceName);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(t("downloadPrepared"));
}

function clearWorkspace() {
  elements.sourceInput.value = "";
  elements.fileInput.value = "";
  elements.fileMeta.textContent = t("sourceHint");
  state.sourceName = "";
  state.formatted = "";
  state.tree = null;
  state.collapsedIds.clear();
  state.nodeById.clear();
  hideError();
  updateSourceLineNumbers();
  renderTree();
  setStatus(t("workspaceCleared"));
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(successMessage);
  } catch {
    showSoftError(t("copyBlocked"));
  }
}

function showParseError(result) {
  const location = result.line && result.column ? ` ${t("lineColumn", { line: result.line, column: result.column })}` : "";
  elements.errorTitle.textContent = t("invalidJson");
  elements.errorMessage.textContent = `${result.message}.${location}`;
  elements.errorExcerpt.textContent = result.excerpt || "";
  elements.errorPanel.hidden = false;
  setStatus(t("invalidJson"));
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

function setStatus(message) {
  elements.statusText.textContent = message;
}

function updateSourceLineNumbers() {
  const lineCount = Math.max(1, elements.sourceInput.value.split("\n").length);
  elements.sourceLineNumbers.textContent = Array.from({ length: lineCount }, (_, index) => index + 1).join("\n");
}

function applyLanguage() {
  elements.languageSelect.value = state.language;
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  elements.statusText.textContent = t("ready");
  elements.sourceTitle.textContent = t("sourceTitle");
  elements.resultTitle.textContent = t("resultTitle");
  elements.fileMeta.textContent = state.sourceName ? elements.fileMeta.textContent : t("sourceHint");
  elements.resultMeta.textContent = state.tree ? elements.resultMeta.textContent : t("resultEmptyMeta");
  elements.languageLabel.textContent = t("languageLabel");
  elements.sourceInput.placeholder = t("placeholder");
  elements.readClipboardButton.textContent = t("readClipboard");
  elements.chooseFileButton.textContent = t("openFile");
  elements.formatButton.textContent = t("format");
  elements.copyAllButton.textContent = t("copyAll");
  elements.downloadButton.textContent = t("download");
  elements.clearButton.textContent = t("clear");
  elements.collapseAllButton.textContent = t("collapseAll");
  elements.expandAllButton.textContent = t("expandAll");
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

  walk(tree);
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
