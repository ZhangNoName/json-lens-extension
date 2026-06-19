import { buildJsonTree, parseJsonInput } from "./json-core.js";

export function createWorkspace(documents = []) {
  const normalizedDocuments = documents.length > 0 ? documents : [createDocument()];

  return {
    documents: normalizedDocuments,
    activeId: normalizedDocuments[0].id
  };
}

export function hydrateWorkspace(records = [], preferredActiveId = null) {
  const documents = records.length > 0
    ? records.map((record, index) => formatDocument(createDocument({
      id: record.id,
      title: record.title || `Untitled ${index + 1}`,
      source: record.source || "",
      sourceName: record.sourceName || "",
      savedAt: record.savedAt || null,
      updatedAt: record.updatedAt || null
    })))
    : [createDocument()];

  const activeId = documents.some((document) => document.id === preferredActiveId)
    ? preferredActiveId
    : documents[0].id;

  return { documents, activeId };
}

export function createDocument(options = {}) {
  const id = options.id || createDocumentId();
  const title = options.title || "Untitled 1";

  return {
    id,
    title,
    source: options.source || "",
    sourceName: options.sourceName || "",
    formatted: "",
    tree: null,
    parseError: null,
    isValid: null,
    collapsedIds: new Set(),
    savedAt: options.savedAt || null,
    updatedAt: options.updatedAt || new Date().toISOString()
  };
}

export function addDocument(workspace, options = {}) {
  const document = createDocument({
    title: options.title || `Untitled ${workspace.documents.length + 1}`,
    source: options.source || "",
    sourceName: options.sourceName || "",
    id: options.id
  });

  return {
    documents: [...workspace.documents, document],
    activeId: document.id
  };
}

export function removeDocument(workspace, documentId) {
  if (workspace.documents.length <= 1) {
    return createWorkspace();
  }

  const index = workspace.documents.findIndex((document) => document.id === documentId);
  if (index === -1) return workspace;

  const documents = workspace.documents.filter((document) => document.id !== documentId);
  const fallbackIndex = Math.max(0, index - 1);
  const activeId = workspace.activeId === documentId
    ? documents[fallbackIndex].id
    : workspace.activeId;

  return { documents, activeId };
}

export function selectDocument(workspace, documentId) {
  if (!workspace.documents.some((document) => document.id === documentId)) {
    return workspace;
  }

  return { ...workspace, activeId: documentId };
}

export function replaceDocument(workspace, replacement) {
  return {
    ...workspace,
    documents: workspace.documents.map((document) =>
      document.id === replacement.id ? replacement : document
    )
  };
}

export function getActiveDocument(workspace) {
  return workspace.documents.find((document) => document.id === workspace.activeId) ?? workspace.documents[0];
}

export function updateDocumentSource(document, source, sourceName = document.sourceName) {
  return {
    ...document,
    source,
    sourceName,
    updatedAt: new Date().toISOString()
  };
}

export function updateDocumentTitle(document, title) {
  return {
    ...document,
    title: title.trim() || document.title,
    updatedAt: new Date().toISOString()
  };
}

export function markDocumentSaved(document) {
  return {
    ...document,
    savedAt: new Date().toISOString()
  };
}

export function formatDocument(document) {
  if (!document.source.trim()) {
    return {
      ...document,
      formatted: "",
      tree: null,
      parseError: null,
      isValid: null,
      collapsedIds: new Set()
    };
  }

  const result = parseJsonInput(document.source);

  if (!result.ok) {
    return {
      ...document,
      parseError: result,
      isValid: false
    };
  }

  return {
    ...document,
    formatted: result.formatted,
    tree: buildJsonTree(result.data),
    parseError: null,
    isValid: true,
    collapsedIds: new Set()
  };
}

export function serializeDocuments(documents) {
  return documents.map((document) => ({
    id: document.id,
    title: document.title,
    source: document.source,
    sourceName: document.sourceName,
    savedAt: document.savedAt,
    updatedAt: document.updatedAt
  }));
}

let documentSequence = 0;

function createDocumentId() {
  documentSequence += 1;
  return `json-${Date.now().toString(36)}-${documentSequence}`;
}
