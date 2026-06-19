export function computeSyncedScrollTop({
  sourceScrollTop,
  sourceScrollHeight,
  sourceClientHeight,
  targetScrollHeight,
  targetClientHeight
}) {
  const sourceRange = Math.max(0, sourceScrollHeight - sourceClientHeight);
  const targetRange = Math.max(0, targetScrollHeight - targetClientHeight);

  if (sourceRange === 0 || targetRange === 0) {
    return 0;
  }

  const progress = clamp(sourceScrollTop / sourceRange, 0, 1);
  return Math.round(progress * targetRange);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
