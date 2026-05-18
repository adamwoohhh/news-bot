import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  checkForUpdate,
  formatUpdateMessage,
  isNewerVersion,
  shouldSkipUpdateCheck,
} from "../src/update-check.ts";

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe("isNewerVersion", () => {
  test("compares semantic versions instead of strings", () => {
    expect(isNewerVersion("0.10.0", "0.9.0")).toBe(true);
    expect(isNewerVersion("v1.2.3", "1.2.3")).toBe(false);
    expect(isNewerVersion("1.2.4", "1.2.3")).toBe(true);
    expect(isNewerVersion("1.2.3", "1.2.4")).toBe(false);
  });
});

describe("shouldSkipUpdateCheck", () => {
  test("skips when disabled by env or CI", () => {
    expect(shouldSkipUpdateCheck({ NEWS_BOT_NO_UPDATE_CHECK: "1" })).toBe(true);
    expect(shouldSkipUpdateCheck({ CI: "true" })).toBe(true);
    expect(shouldSkipUpdateCheck({ NEWS_BOT_NO_UPDATE_CHECK: "0", CI: "false" })).toBe(false);
  });
});

describe("checkForUpdate", () => {
  test("returns available update from GitHub latest release and caches it", async () => {
    const cacheDir = await mkdtemp(join(tmpdir(), "news-bot-update-"));
    tempDirs.push(cacheDir);
    let fetchCount = 0;

    const result = await checkForUpdate({
      currentVersion: "0.1.5",
      cacheDir,
      now: new Date("2026-05-18T10:00:00.000Z"),
      fetchLatestRelease: async () => {
        fetchCount++;
        return {
          tagName: "v0.2.0",
          htmlUrl: "https://github.com/adamwoohhh/news-bot/releases/tag/v0.2.0",
        };
      },
    });

    expect(result).toEqual({
      available: true,
      currentVersion: "0.1.5",
      latestVersion: "0.2.0",
      url: "https://github.com/adamwoohhh/news-bot/releases/tag/v0.2.0",
    });
    expect(fetchCount).toBe(1);

    const cached = await Bun.file(join(cacheDir, "update-check.json")).json();
    expect(cached).toEqual({
      checkedAt: "2026-05-18T10:00:00.000Z",
      latestVersion: "0.2.0",
      latestUrl: "https://github.com/adamwoohhh/news-bot/releases/tag/v0.2.0",
    });
  });

  test("uses fresh cache without fetching", async () => {
    const cacheDir = await mkdtemp(join(tmpdir(), "news-bot-update-"));
    tempDirs.push(cacheDir);
    await Bun.write(
      join(cacheDir, "update-check.json"),
      JSON.stringify({
        checkedAt: "2026-05-18T09:00:00.000Z",
        latestVersion: "0.2.0",
        latestUrl: "https://github.com/adamwoohhh/news-bot/releases/tag/v0.2.0",
      }),
    );

    const result = await checkForUpdate({
      currentVersion: "0.1.5",
      cacheDir,
      now: new Date("2026-05-18T10:00:00.000Z"),
      fetchLatestRelease: async () => {
        throw new Error("should not fetch");
      },
    });

    expect(result.available).toBe(true);
  });

  test("returns no update when network check fails", async () => {
    const cacheDir = await mkdtemp(join(tmpdir(), "news-bot-update-"));
    tempDirs.push(cacheDir);

    const result = await checkForUpdate({
      currentVersion: "0.1.5",
      cacheDir,
      now: new Date("2026-05-18T10:00:00.000Z"),
      fetchLatestRelease: async () => {
        throw new Error("offline");
      },
    });

    expect(result).toEqual({ available: false });
  });
});

describe("formatUpdateMessage", () => {
  test("formats update notice for stderr", () => {
    expect(
      formatUpdateMessage({
        available: true,
        currentVersion: "0.1.5",
        latestVersion: "0.2.0",
        url: "https://github.com/adamwoohhh/news-bot/releases/tag/v0.2.0",
      }),
    ).toBe(
      "news-bot 0.2.0 is available, current 0.1.5.\nRelease: https://github.com/adamwoohhh/news-bot/releases/tag/v0.2.0",
    );
  });
});
