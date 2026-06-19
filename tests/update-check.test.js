import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLatestReleaseUrl,
  compareVersions,
  isNewerVersion,
  normalizeReleaseVersion,
  parseLatestRelease
} from "../scripts/update-check.js";

test("normalizes release tag names into manifest-style versions", () => {
  assert.equal(normalizeReleaseVersion("release-v0.1.6"), "0.1.6");
  assert.equal(normalizeReleaseVersion("v0.1.6"), "0.1.6");
  assert.equal(normalizeReleaseVersion("0.1.6"), "0.1.6");
});

test("compares dotted versions numerically", () => {
  assert.equal(compareVersions("0.1.10", "0.1.5") > 0, true);
  assert.equal(compareVersions("0.1.5", "0.1.5"), 0);
  assert.equal(compareVersions("0.2.0", "0.10.0") < 0, true);
});

test("detects newer latest release versions", () => {
  assert.equal(isNewerVersion("0.1.5", "0.1.6"), true);
  assert.equal(isNewerVersion("0.1.6", "0.1.6"), false);
  assert.equal(isNewerVersion("0.1.7", "0.1.6"), false);
});

test("parses the GitHub latest release response", () => {
  assert.deepEqual(
    parseLatestRelease({
      tag_name: "release-v0.1.6",
      html_url: "https://github.com/ZhangNoName/json-lens-extension/releases/tag/release-v0.1.6",
      name: "JSON Lens Extension v0.1.6"
    }),
    {
      version: "0.1.6",
      url: "https://github.com/ZhangNoName/json-lens-extension/releases/tag/release-v0.1.6",
      name: "JSON Lens Extension v0.1.6"
    }
  );
});

test("builds the GitHub latest release API URL", () => {
  assert.equal(
    buildLatestReleaseUrl("owner/repo"),
    "https://api.github.com/repos/owner/repo/releases/latest"
  );
});
