import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8");

test("hidden panes stay hidden even when pane display rules are present", () => {
  assert.match(css, /\.pane\[hidden\]\s*\{[^}]*display:\s*none\s*!important;/s);
});

test("tab add and close controls have explicit contrast-safe states", () => {
  assert.match(css, /\.document-tab-add\s*\{/);
  assert.match(css, /\.document-tab-close:hover:not\(:disabled\)\s*\{[^}]*color:\s*#fff;[^}]*background:\s*#9a3412;/s);
});
