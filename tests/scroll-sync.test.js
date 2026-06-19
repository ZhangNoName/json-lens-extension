import assert from "node:assert/strict";
import test from "node:test";

import { computeSyncedScrollTop } from "../scripts/scroll-sync.js";

test("computeSyncedScrollTop maps source scroll progress to target scroll progress", () => {
  const result = computeSyncedScrollTop({
    sourceScrollTop: 50,
    sourceScrollHeight: 300,
    sourceClientHeight: 100,
    targetScrollHeight: 500,
    targetClientHeight: 100
  });

  assert.equal(result, 100);
});

test("computeSyncedScrollTop clamps progress into the target range", () => {
  const result = computeSyncedScrollTop({
    sourceScrollTop: 999,
    sourceScrollHeight: 300,
    sourceClientHeight: 100,
    targetScrollHeight: 500,
    targetClientHeight: 100
  });

  assert.equal(result, 400);
});

test("computeSyncedScrollTop returns zero when either side cannot scroll", () => {
  assert.equal(computeSyncedScrollTop({
    sourceScrollTop: 20,
    sourceScrollHeight: 100,
    sourceClientHeight: 100,
    targetScrollHeight: 500,
    targetClientHeight: 100
  }), 0);

  assert.equal(computeSyncedScrollTop({
    sourceScrollTop: 20,
    sourceScrollHeight: 300,
    sourceClientHeight: 100,
    targetScrollHeight: 100,
    targetClientHeight: 100
  }), 0);
});
