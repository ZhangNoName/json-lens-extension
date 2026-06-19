import assert from "node:assert/strict";
import test from "node:test";

import {
  getInitialLanguage,
  getMessages,
  normalizeLanguage,
  translate
} from "../scripts/i18n.js";

test("normalizeLanguage supports English and Chinese variants", () => {
  assert.equal(normalizeLanguage("zh-CN"), "zh");
  assert.equal(normalizeLanguage("zh-Hans"), "zh");
  assert.equal(normalizeLanguage("en-US"), "en");
  assert.equal(normalizeLanguage("fr-FR"), "en");
});

test("getInitialLanguage prefers stored language over browser language", () => {
  assert.equal(getInitialLanguage("en", "zh-CN"), "en");
  assert.equal(getInitialLanguage("", "zh-CN"), "zh");
  assert.equal(getInitialLanguage(null, "de-DE"), "en");
});

test("translate falls back to English for missing keys", () => {
  assert.equal(translate("zh", "appName"), "JSON Lens");
  assert.equal(translate("en", "missingKey", { fallback: "Fallback" }), "Fallback");
});

test("getMessages returns a copy of localized messages", () => {
  const messages = getMessages("zh");

  assert.equal(messages.format, "格式化");
  messages.format = "mutated";
  assert.equal(getMessages("zh").format, "格式化");
});
