import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");

test("release notes are generated in English and Chinese", () => {
  assert.match(workflow, /## Release Notes \/ 发布说明/);
  assert.match(workflow, /### English/);
  assert.match(workflow, /### 中文/);
});

test("release package includes the license file", () => {
  assert.match(workflow, /manifest\.json, background\.js, app\.html, README\.md, LICENSE/);
});
