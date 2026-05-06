import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runLarkDoc } from "../src/commands/lark-doc.ts";

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe("runLarkDoc", () => {
  test("fetches markdown, derives title filename, and writes file", async () => {
    const root = await mkdtemp(join(tmpdir(), "news-bot-"));
    tempDirs.push(root);

    const result = await runLarkDoc(
      { doc: "doc-token", out: root },
      {},
      {
        fetchMarkdown: async (doc) => {
          expect(doc).toBe("doc-token");
          return "# 需求文档\n\nbody";
        },
        log: () => {},
      },
    );

    expect(result.endsWith("xu-qiu-wen-dang.md")).toBe(true);
    expect(await Bun.file(result).text()).toBe("# 需求文档\n\nbody");
  });

  test("throws before writing when fetched markdown is blank", async () => {
    const root = await mkdtemp(join(tmpdir(), "news-bot-"));
    tempDirs.push(root);

    await expect(
      runLarkDoc(
        { doc: "doc-token", out: root },
        {},
        {
          fetchMarkdown: async () => "   ",
          log: () => {},
        },
      ),
    ).rejects.toThrow("Fetched Markdown is empty");
  });
});
