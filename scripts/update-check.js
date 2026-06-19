export const UPDATE_REPOSITORY = "ZhangNoName/json-lens-extension";

export function buildLatestReleaseUrl(repository = UPDATE_REPOSITORY) {
  return `https://api.github.com/repos/${repository}/releases/latest`;
}

export function normalizeReleaseVersion(value) {
  return String(value || "")
    .trim()
    .replace(/^release-/i, "")
    .replace(/^v/i, "")
    .match(/\d+(?:\.\d+)*/)?.[0] ?? "0.0.0";
}

export function compareVersions(left, right) {
  const leftParts = normalizeReleaseVersion(left).split(".").map(Number);
  const rightParts = normalizeReleaseVersion(right).split(".").map(Number);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }

  return 0;
}

export function isNewerVersion(currentVersion, latestVersion) {
  return compareVersions(latestVersion, currentVersion) > 0;
}

export function parseLatestRelease(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Release payload is not an object.");
  }

  const version = normalizeReleaseVersion(payload.tag_name);
  const url = String(payload.html_url || "");
  const name = String(payload.name || payload.tag_name || version);

  if (!url) {
    throw new Error("Release payload does not include a page URL.");
  }

  return { version, url, name };
}

export async function fetchLatestRelease(fetchImpl = globalThis.fetch, repository = UPDATE_REPOSITORY) {
  if (typeof fetchImpl !== "function") {
    throw new Error("Fetch is not available.");
  }

  const response = await fetchImpl(buildLatestReleaseUrl(repository), {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (!response.ok) {
    throw new Error(`Release check failed with HTTP ${response.status}.`);
  }

  return parseLatestRelease(await response.json());
}

export function getCurrentExtensionVersion(runtime = globalThis.chrome?.runtime) {
  return normalizeReleaseVersion(runtime?.getManifest?.().version);
}
