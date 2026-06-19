import assert from "node:assert/strict";
import test from "node:test";

import {
  buildJsonTree,
  collectCollapsibleIds,
  createDownloadName,
  getVisibleRows,
  parseJsonInput,
  stringifyNodeValue
} from "../scripts/json-core.js";

test("parseJsonInput formats valid JSON with two-space indentation", () => {
  const result = parseJsonInput('{"name":"Ada","items":[1,true,null]}');

  assert.equal(result.ok, true);
  assert.equal(result.formatted, '{\n  "name": "Ada",\n  "items": [\n    1,\n    true,\n    null\n  ]\n}');
  assert.deepEqual(result.data.items, [1, true, null]);
});

test("parseJsonInput reports line, column, and excerpt for invalid JSON", () => {
  const result = parseJsonInput('{\n  "name": "Ada",\n  bad\n}');

  assert.equal(result.ok, false);
  assert.equal(result.line, 3);
  assert.equal(result.column, 3);
  assert.match(result.message, /JSON/i);
  assert.match(result.excerpt, /bad/);
});

test("buildJsonTree creates stable object and array node paths", () => {
  const tree = buildJsonTree({ user: { name: "Ada" }, scores: [3, 5] });

  assert.equal(tree.id, "root");
  assert.equal(tree.type, "object");
  assert.equal(tree.children[0].id, "root.user");
  assert.equal(tree.children[0].children[0].id, "root.user.name");
  assert.equal(tree.children[1].children[0].id, "root.scores[0]");
});

test("getVisibleRows hides descendants of collapsed nodes", () => {
  const tree = buildJsonTree({ user: { name: "Ada" }, active: true });
  const rows = getVisibleRows(tree, new Set(["root.user"]));

  assert.deepEqual(
    rows.map((row) => row.id),
    ["root", "root.user", "root.active"]
  );
  assert.equal(rows[1].isCollapsed, true);
  assert.equal(rows[1].lineNumber, 2);
});

test("collectCollapsibleIds returns object and array ids", () => {
  const tree = buildJsonTree({ user: { name: "Ada" }, scores: [3] });

  assert.deepEqual(collectCollapsibleIds(tree), ["root", "root.user", "root.scores"]);
});

test("stringifyNodeValue returns formatted JSON for copied nodes", () => {
  const tree = buildJsonTree({ user: { name: "Ada" } });
  const userNode = tree.children[0];
  const nameNode = userNode.children[0];

  assert.equal(stringifyNodeValue(userNode), '{\n  "name": "Ada"\n}');
  assert.equal(stringifyNodeValue(nameNode), '"Ada"');
});

test("createDownloadName creates a clean json filename", () => {
  assert.equal(createDownloadName("payload.txt"), "payload-formatted.json");
  assert.equal(createDownloadName(""), "formatted-json.json");
  assert.equal(createDownloadName("bad/name?.json"), "bad-name-formatted.json");
});
