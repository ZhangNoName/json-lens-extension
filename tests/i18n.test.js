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

test("translate interpolates message values", () => {
  assert.equal(
    translate("en", "largeAutoFormatPaused", { size: "1.2 MB" }),
    "Large JSON detected (1.2 MB). Auto-format paused; use Format when ready."
  );
  assert.equal(
    translate("zh", "largeAutoFormatPaused", { size: "1.2 MB" }),
    "检测到大 JSON（1.2 MB），已暂停自动格式化，请需要时点击格式化。"
  );
});

test("getMessages returns a copy of localized messages", () => {
  const messages = getMessages("zh");

  assert.equal(messages.format, "格式化");
  messages.format = "mutated";
  assert.equal(getMessages("zh").format, "格式化");
});

test("translate includes the tab rename action label in both languages", () => {
  assert.equal(translate("en", "renameDocument"), "Rename document");
  assert.equal(translate("en", "saveRename"), "Save name");
  assert.equal(translate("en", "cancelRename"), "Cancel rename");
  assert.equal(translate("zh", "renameDocument"), "重命名文档");
  assert.equal(translate("zh", "saveRename"), "保存名称");
  assert.equal(translate("zh", "cancelRename"), "取消重命名");
});
