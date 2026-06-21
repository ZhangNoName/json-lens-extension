import assert from "node:assert/strict";
import test from "node:test";

import {
  LARGE_SOURCE_AUTO_FORMAT_LIMIT,
  createSourceLineNumbers,
  getSourceSizeLabel,
  shouldAutoFormatSource
} from "../scripts/large-file.js";

test("large sources do not auto-format on every edit", () => {
  assert.equal(shouldAutoFormatSource("{}".padEnd(LARGE_SOURCE_AUTO_FORMAT_LIMIT, " ")), true);
  assert.equal(shouldAutoFormatSource("{}".padEnd(LARGE_SOURCE_AUTO_FORMAT_LIMIT + 1, " ")), false);
});

test("source size labels use readable units", () => {
  assert.equal(getSourceSizeLabel("abc"), "3 B");
  assert.equal(getSourceSizeLabel("x".repeat(2048)), "2.0 KB");
  assert.equal(getSourceSizeLabel("x".repeat(2 * 1024 * 1024)), "2.0 MB");
});

test("large source line numbers are capped to avoid huge gutter rendering", () => {
  assert.equal(createSourceLineNumbers("{\n}"), "1\n2");
  assert.equal(createSourceLineNumbers("x".repeat(LARGE_SOURCE_AUTO_FORMAT_LIMIT + 1)), "1\n...");
});
