const SUPPORTED_LANGUAGES = new Set(["en", "zh"]);

const MESSAGES = {
  en: {
    appName: "JSON Lens",
    ready: "Ready for JSON input",
    sourceHint: "Paste JSON, read the clipboard, or choose a local file.",
    sourceTitle: "Source",
    resultTitle: "Formatted Tree",
    resultEmptyMeta: "No formatted JSON yet.",
    resultEmpty: "Formatted JSON will appear here.",
    readClipboard: "Read Clipboard",
    openFile: "Open File",
    format: "Format",
    copyAll: "Copy All",
    download: "Download",
    clear: "Clear",
    collapseAll: "Collapse All",
    expandAll: "Expand All",
    languageLabel: "Language",
    editing: "Editing source JSON",
    clipboardLoaded: "Clipboard text loaded",
    fileLoaded: "File loaded",
    jsonFormatted: "JSON formatted",
    invalidJson: "Invalid JSON",
    actionNeedsAttention: "Action needs attention",
    allCollapsed: "All levels collapsed",
    allExpanded: "All levels expanded",
    copiedAll: "Formatted JSON copied",
    copiedNode: "Node copied",
    downloadPrepared: "Download prepared",
    workspaceCleared: "Workspace cleared",
    fileMetaLoaded: "{name} loaded, {size}.",
    clipboardMeta: "Loaded from clipboard.",
    visibleRows: "{visible} visible rows. {lines} formatted JSON lines.",
    clipboardUnavailable: "Clipboard access was not available. Use the browser permission prompt or paste manually.",
    fileReadFailed: "The selected file could not be read.",
    copyBlocked: "Copy was blocked by the browser. Select the text and copy manually.",
    lineColumn: "Line {line}, column {column}.",
    expandNode: "Expand node",
    collapseNode: "Collapse node",
    copyNode: "Copy this node",
    copy: "Copy",
    placeholder: "{\"hello\":\"world\"}"
  },
  zh: {
    appName: "JSON Lens",
    ready: "可以输入 JSON",
    sourceHint: "粘贴 JSON、读取剪贴板，或选择本地文件。",
    sourceTitle: "源内容",
    resultTitle: "格式化树",
    resultEmptyMeta: "还没有格式化的 JSON。",
    resultEmpty: "格式化后的 JSON 会显示在这里。",
    readClipboard: "读取剪贴板",
    openFile: "打开文件",
    format: "格式化",
    copyAll: "复制全部",
    download: "下载",
    clear: "清空",
    collapseAll: "折叠全部",
    expandAll: "展开全部",
    languageLabel: "语言",
    editing: "正在编辑源 JSON",
    clipboardLoaded: "已读取剪贴板内容",
    fileLoaded: "文件已加载",
    jsonFormatted: "JSON 已格式化",
    invalidJson: "JSON 无效",
    actionNeedsAttention: "操作需要处理",
    allCollapsed: "已折叠全部层级",
    allExpanded: "已展开全部层级",
    copiedAll: "已复制格式化 JSON",
    copiedNode: "已复制节点内容",
    downloadPrepared: "下载已准备",
    workspaceCleared: "工作区已清空",
    fileMetaLoaded: "已加载 {name}，大小 {size}。",
    clipboardMeta: "已从剪贴板加载。",
    visibleRows: "{visible} 个可见行，格式化 JSON 共 {lines} 行。",
    clipboardUnavailable: "无法访问剪贴板。请允许浏览器权限，或手动粘贴。",
    fileReadFailed: "无法读取所选文件。",
    copyBlocked: "复制被浏览器阻止。请选中文本后手动复制。",
    lineColumn: "第 {line} 行，第 {column} 列。",
    expandNode: "展开节点",
    collapseNode: "折叠节点",
    copyNode: "复制此节点",
    copy: "复制",
    placeholder: "{\"hello\":\"world\"}"
  }
};

export function normalizeLanguage(language) {
  const normalized = String(language || "en").toLowerCase();
  if (normalized.startsWith("zh")) return "zh";
  if (normalized.startsWith("en")) return "en";
  return "en";
}

export function getInitialLanguage(storedLanguage, browserLanguage) {
  if (storedLanguage && SUPPORTED_LANGUAGES.has(storedLanguage)) {
    return storedLanguage;
  }

  return normalizeLanguage(browserLanguage);
}

export function getMessages(language) {
  return { ...MESSAGES[normalizeLanguage(language)] };
}

export function translate(language, key, values = {}) {
  const normalized = normalizeLanguage(language);
  const message = MESSAGES[normalized][key] ?? MESSAGES.en[key] ?? values.fallback ?? key;

  return Object.entries(values).reduce((text, [name, value]) => {
    if (name === "fallback") return text;
    return text.replaceAll(`{${name}}`, String(value));
  }, message);
}
