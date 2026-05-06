import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { writeUniqueMarkdownFile } from "../src/writer.ts";

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe("writeUniqueMarkdownFile", () => {
  test("creates the output directory and writes markdown", async () => {
    const root = await mkdtemp(join(tmpdir(), "news-bot-"));
    tempDirs.push(root);

    const output = await writeUniqueMarkdownFile(join(root, "nested"), "title.md", "# Title");
    expect(output.endsWith("nested/title.md")).toBe(true);
    expect(await Bun.file(output).text()).toBe("# Title");
  });

  test("adds numeric suffix when file already exists", async () => {
    const root = await mkdtemp(join(tmpdir(), "news-bot-"));
    tempDirs.push(root);
    await writeFile(join(root, "title.md"), "existing");

    const output = await writeUniqueMarkdownFile(root, "title.md", "new");
    expect(output.endsWith("title-2.md")).toBe(true);
    expect(await Bun.file(output).text()).toBe("new");
  });
});
