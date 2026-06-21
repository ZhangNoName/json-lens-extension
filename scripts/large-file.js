export const LARGE_SOURCE_AUTO_FORMAT_LIMIT = 1024 * 1024;

export function shouldAutoFormatSource(source, limit = LARGE_SOURCE_AUTO_FORMAT_LIMIT) {
  return String(source || "").length <= limit;
}

export function getSourceSizeLabel(source) {
  const bytes = String(source || "").length;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function createSourceLineNumbers(source) {
  const text = String(source || "");

  if (!shouldAutoFormatSource(text)) {
    return "1\n...";
  }

  const lineCount = Math.max(1, text.split("\n").length);
  return Array.from({ length: lineCount }, (_, index) => index + 1).join("\n");
}
