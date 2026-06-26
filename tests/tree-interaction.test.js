import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = readFileSync(new URL("../scripts/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles/app.css", import.meta.url), "utf8");

test("tree rows use a row-level collapse affordance before the line number", () => {
  assert.match(app, /rowToggle\.className = "row-toggle"/);
  assert.match(app, /rowElement\.setAttribute\("aria-expanded"/);
  assert.match(app, /event\.target\.closest\("\.tree-row\[data-collapsible='true'\]"\)/);
  assert.doesNotMatch(app, /dataset\.action = "toggle"/);
});

test("tree row layout reserves the first column for the collapse indicator", () => {
  assert.match(css, /\.tree-row\s*\{[^}]*grid-template-columns:\s*24px 52px/s);
  assert.match(css, /\.tree-row\[data-collapsible="true"\]\s*\{[^}]*cursor:\s*pointer;/s);
});

test("tree rows render a colon separator between key and value", () => {
  assert.match(app, /separator\.className = "separator"/);
  assert.match(app, /separator\.textContent = row\.id === "root" \? "" : ":"/);
  assert.match(css, /\.separator\s*\{/);
});
