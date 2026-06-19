const COMPOSITE_TYPES = new Set(["object", "array"]);

export function parseJsonInput(input) {
  try {
    const data = JSON.parse(input);
    return {
      ok: true,
      data,
      formatted: JSON.stringify(data, null, 2)
    };
  } catch (error) {
    const position = extractPosition(error.message, input);
    const location = position == null ? {} : getLineColumn(input, position);

    return {
      ok: false,
      message: `Invalid JSON: ${error.message}`,
      position,
      line: location.line ?? null,
      column: location.column ?? null,
      excerpt: buildExcerpt(input, location.line)
    };
  }
}

export function buildJsonTree(value, key = null, path = "root", depth = 0) {
  const type = getJsonType(value);
  const node = {
    id: path,
    key,
    type,
    value,
    depth,
    children: []
  };

  if (type === "object") {
    node.children = Object.entries(value).map(([childKey, childValue]) =>
      buildJsonTree(childValue, childKey, `${path}.${childKey}`, depth + 1)
    );
  }

  if (type === "array") {
    node.children = value.map((childValue, index) =>
      buildJsonTree(childValue, index, `${path}[${index}]`, depth + 1)
    );
  }

  return node;
}

export function getVisibleRows(tree, collapsedIds = new Set()) {
  const rows = [];

  function walk(node) {
    const isCollapsible = COMPOSITE_TYPES.has(node.type);
    const isCollapsed = isCollapsible && collapsedIds.has(node.id);

    rows.push({
      id: node.id,
      key: node.key,
      type: node.type,
      depth: node.depth,
      value: node.value,
      node,
      isCollapsible,
      isCollapsed,
      summary: createSummary(node),
      lineNumber: rows.length + 1
    });

    if (!isCollapsed) {
      node.children.forEach(walk);
    }
  }

  walk(tree);
  return rows;
}

export function collectCollapsibleIds(tree) {
  const ids = [];

  function walk(node) {
    if (COMPOSITE_TYPES.has(node.type)) {
      ids.push(node.id);
    }

    node.children.forEach(walk);
  }

  walk(tree);
  return ids;
}

export function stringifyNodeValue(node) {
  if (COMPOSITE_TYPES.has(node.type)) {
    return JSON.stringify(node.value, null, 2);
  }

  return JSON.stringify(node.value);
}

export function createDownloadName(sourceName) {
  const rawName = sourceName || "formatted-json";
  const withoutExtension = rawName.replace(/\.[^.\\/]+$/, "");
  const cleanName = withoutExtension
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${cleanName || "formatted-json"}-formatted.json`.replace(
    /^formatted-json-formatted\.json$/,
    "formatted-json.json"
  );
}

export function createSummary(node) {
  if (node.type === "object") {
    const count = node.children.length;
    return count === 1 ? "{ 1 key }" : `{ ${count} keys }`;
  }

  if (node.type === "array") {
    const count = node.children.length;
    return count === 1 ? "[ 1 item ]" : `[ ${count} items ]`;
  }

  return JSON.stringify(node.value);
}

function getJsonType(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function extractPosition(message, input) {
  const positionMatch = message.match(/position\s+(\d+)/i);
  if (positionMatch) {
    return Number(positionMatch[1]);
  }

  const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lineColumnMatch) {
    return positionFromLineColumn(
      input,
      Number(lineColumnMatch[1]),
      Number(lineColumnMatch[2])
    );
  }

  return null;
}

function positionFromLineColumn(input, line, column) {
  const lines = input.split("\n");
  let position = 0;

  for (let index = 0; index < line - 1; index += 1) {
    position += (lines[index] ?? "").length + 1;
  }

  return position + column - 1;
}

function getLineColumn(input, position) {
  const before = input.slice(0, position);
  const lines = before.split("\n");

  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

function buildExcerpt(input, line) {
  if (!line) return input.slice(0, 160);

  const lines = input.split("\n");
  const start = Math.max(0, line - 2);
  const end = Math.min(lines.length, line + 1);

  return lines
    .slice(start, end)
    .map((content, index) => `${start + index + 1}: ${content}`)
    .join("\n");
}
