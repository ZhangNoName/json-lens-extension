import assert from "node:assert/strict";
import test from "node:test";

import {
  addDocument,
  createDocument,
  createWorkspace,
  formatDocument,
  getActiveDocument,
  hydrateWorkspace,
  removeDocument,
  serializeDocuments,
  updateDocumentSource
} from "../scripts/workspace-core.js";

test("createWorkspace starts with one editable document", () => {
  const workspace = createWorkspace();

  assert.equal(workspace.documents.length, 1);
  assert.equal(workspace.activeId, workspace.documents[0].id);
  assert.equal(workspace.documents[0].title, "Untitled 1");
  assert.equal(workspace.documents[0].source, "");
});

test("addDocument creates a second active document with a stable title", () => {
  const workspace = addDocument(createWorkspace(), { source: "{\"ok\":true}" });

  assert.equal(workspace.documents.length, 2);
  assert.equal(getActiveDocument(workspace).title, "Untitled 2");
  assert.equal(getActiveDocument(workspace).source, "{\"ok\":true}");
});

test("formatDocument keeps previous valid tree when edited source becomes invalid", () => {
  const formatted = formatDocument(createDocument({ source: "{\"name\":\"Ada\"}" }));
  const invalid = formatDocument(updateDocumentSource(formatted, "{ bad"));

  assert.equal(formatted.isValid, true);
  assert.equal(invalid.isValid, false);
  assert.equal(invalid.formatted, formatted.formatted);
  assert.equal(invalid.tree, formatted.tree);
  assert.match(invalid.parseError.message, /Invalid JSON/);
});

test("formatDocument replaces previous valid tree when edited source becomes valid again", () => {
  const first = formatDocument(createDocument({ source: "{\"name\":\"Ada\"}" }));
  const invalid = formatDocument(updateDocumentSource(first, "{ bad"));
  const second = formatDocument(updateDocumentSource(invalid, "{\"name\":\"Grace\"}"));

  assert.equal(second.isValid, true);
  assert.equal(second.parseError, null);
  assert.match(second.formatted, /Grace/);
  assert.doesNotMatch(second.formatted, /Ada/);
});

test("removeDocument keeps at least one document and selects a neighbor", () => {
  const workspace = addDocument(createWorkspace(), { source: "{\"ok\":true}" });
  const activeId = workspace.activeId;
  const removed = removeDocument(workspace, activeId);

  assert.equal(removed.documents.length, 1);
  assert.equal(removed.activeId, removed.documents[0].id);

  const lastRemoved = removeDocument(removed, removed.activeId);
  assert.equal(lastRemoved.documents.length, 1);
  assert.equal(lastRemoved.documents[0].title, "Untitled 1");
});

test("serializeDocuments and hydrateWorkspace preserve saved document text", () => {
  const workspace = addDocument(createWorkspace(), {
    id: "json-2",
    title: "Payload",
    sourceName: "payload.json",
    source: "{\"count\":2}"
  });
  const records = serializeDocuments(workspace.documents);
  const hydrated = hydrateWorkspace(records, "json-2");

  assert.equal(records[1].title, "Payload");
  assert.equal(records[1].formatted, undefined);
  assert.equal(hydrated.activeId, "json-2");
  assert.equal(getActiveDocument(hydrated).isValid, true);
  assert.match(getActiveDocument(hydrated).formatted, /count/);
});
