import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8");

test("hidden panes stay hidden even when pane display rules are present", () => {
  assert.match(css, /\.pane\[hidden\]\s*\{[^}]*display:\s*none\s*!important;/s);
});
