import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const dayMs = 24 * 60 * 60 * 1000;
const latestReleaseUrl = "https://api.github.com/repos/adamwoohhh/news-bot/releases/latest";

export type UpdateCheckResult =
  | { available: false }
  | {
      available: true;
      currentVersion: string;
      latestVersion: string;
      url: string;
    };

type LatestRelease = {
  tagName: string;
  htmlUrl: string;
};

type UpdateCache = {
  checkedAt: string;
  latestVersion: string;
  latestUrl: string;
};

export type UpdateCheckOptions = {
  currentVersion: string;
  cacheDir?: string;
  now?: Date;
  fetchLatestRelease?: () => Promise<LatestRelease>;
};

export async function checkForUpdate(options: UpdateCheckOptions): Promise<UpdateCheckResult> {
  const now = options.now ?? new Date();
  const cacheDir = options.cacheDir ?? defaultCacheDir();
  const cached = await readFreshCache(cacheDir, now);
  if (cached) {
    return toResult(options.currentVersion, cached.latestVersion, cached.latestUrl);
  }

  try {
    const latest = await (options.fetchLatestRelease ?? fetchGitHubLatestRelease)();
    const latestVersion = normalizeVersion(latest.tagName);
    await writeCache(cacheDir, {
      checkedAt: now.toISOString(),
      latestVersion,
      latestUrl: latest.htmlUrl,
    });
    return toResult(options.currentVersion, latestVersion, latest.htmlUrl);
  } catch {
    return { available: false };
  }
}

export function shouldSkipUpdateCheck(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return isTruthy(env.NEWS_BOT_NO_UPDATE_CHECK) || isTruthy(env.CI);
}

export function formatUpdateMessage(result: UpdateCheckResult): string | undefined {
  if (!result.available) {
    return undefined;
  }

  return [
    `news-bot ${result.latestVersion} is available, current ${result.currentVersion}.`,
    `Release: ${result.url}`,
  ].join("\n");
}

export function isNewerVersion(candidate: string, current: string): boolean {
  const left = parseVersion(candidate);
  const right = parseVersion(current);
  for (let index = 0; index < 3; index++) {
    if (left[index] > right[index]) {
      return true;
    }
    if (left[index] < right[index]) {
      return false;
    }
  }

  return false;
}

async function fetchGitHubLatestRelease(): Promise<LatestRelease> {
  const response = await fetch(latestReleaseUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "news-bot-update-check",
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub latest release request failed: ${response.status}`);
  }

  const body = await response.json() as { tag_name?: unknown; html_url?: unknown };
  if (typeof body.tag_name !== "string" || typeof body.html_url !== "string") {
    throw new Error("GitHub latest release response is missing tag_name or html_url");
  }

  return {
    tagName: body.tag_name,
    htmlUrl: body.html_url,
  };
}

async function readFreshCache(cacheDir: string, now: Date): Promise<UpdateCache | undefined> {
  try {
    const cache = await Bun.file(cachePath(cacheDir)).json() as unknown;
    if (!isValidCache(cache)) {
      return undefined;
    }

    const checkedAt = new Date(cache.checkedAt);
    if (Number.isNaN(checkedAt.valueOf())) {
      return undefined;
    }

    return now.getTime() - checkedAt.getTime() < dayMs ? cache : undefined;
  } catch {
    return undefined;
  }
}

async function writeCache(cacheDir: string, cache: UpdateCache): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  await Bun.write(cachePath(cacheDir), `${JSON.stringify(cache, null, 2)}\n`);
}

function toResult(
  currentVersion: string,
  latestVersion: string,
  url: string,
): UpdateCheckResult {
  if (!isNewerVersion(latestVersion, currentVersion)) {
    return { available: false };
  }

  return {
    available: true,
    currentVersion,
    latestVersion,
    url,
  };
}

function cachePath(cacheDir: string): string {
  return join(cacheDir, "update-check.json");
}

function defaultCacheDir(): string {
  return join(process.env.HOME ?? ".", ".cache", "news-bot");
}

function isValidCache(value: unknown): value is UpdateCache {
  return (
    typeof value === "object" &&
    value !== null &&
    "checkedAt" in value &&
    "latestVersion" in value &&
    "latestUrl" in value &&
    typeof value.checkedAt === "string" &&
    typeof value.latestVersion === "string" &&
    typeof value.latestUrl === "string"
  );
}

function isTruthy(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() ?? "");
}

function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, "");
}

function parseVersion(version: string): [number, number, number] {
  const [major, minor, patch] = normalizeVersion(version)
    .split("-", 1)[0]
    .split(".")
    .map((part) => Number.parseInt(part, 10));

  return [
    Number.isFinite(major) ? major : 0,
    Number.isFinite(minor) ? minor : 0,
    Number.isFinite(patch) ? patch : 0,
  ];
}
