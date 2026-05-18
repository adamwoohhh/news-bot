import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
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

  test("forwards lark-cli passthrough options to markdown fetch", async () => {
    const root = await mkdtemp(join(tmpdir(), "news-bot-"));
    tempDirs.push(root);
    let fetchArgs: unknown[] | undefined;

    await runLarkDoc(
      {
        doc: "doc-token",
        out: root,
        params: "{\"a\":1}",
        as: "user",
        pageAll: true,
        jq: ".data",
        profile: "dev",
      },
      {},
      {
        fetchMarkdown: async (...args) => {
          fetchArgs = args;
          return "# Title\n\nbody";
        },
        log: () => {},
      },
    );

    expect(fetchArgs).toEqual([
      "doc-token",
      {
        params: "{\"a\":1}",
        as: "user",
        pageAll: true,
        jq: ".data",
        profile: "dev",
      },
    ]);
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

  test("downloads media, rewrites links, and writes rewritten markdown", async () => {
    const root = await mkdtemp(join(tmpdir(), "news-bot-"));
    tempDirs.push(root);
    const downloaded: Array<{ token: string; outputPath: string }> = [];

    const result = await runLarkDoc(
      { doc: "doc-token", out: root, downloadMedia: true },
      {},
      {
        fetchMarkdown: async () =>
          "# With Media\n\n![image](https://example.feishu.cn/file?token=imageToken)",
        downloadMedia: async (token, outputPath) => {
          downloaded.push({ token, outputPath });
          await writeFile(outputPath, "media");
        },
        log: () => {},
      },
    );

    expect(result).toBe(join(root, "with-media", "index.md"));
    expect(downloaded).toEqual([
      { token: "imageToken", outputPath: join(root, "with-media", "media", "imageToken.png") },
    ]);
    expect(await Bun.file(result).text()).toBe("# With Media\n\n![image](./media/imageToken.png)");
  });

  test("downloads media from lark image and file tags", async () => {
    const root = await mkdtemp(join(tmpdir(), "news-bot-"));
    tempDirs.push(root);
    const downloaded: Array<{ token: string; outputPath: string }> = [];

    const result = await runLarkDoc(
      { doc: "doc-token", out: root, downloadMedia: true },
      {},
      {
        fetchMarkdown: async () => [
          "# With Lark Tags",
          "",
          '<image token="imageToken" width="1024" height="768"/>',
          '<file token="fileToken" name="demo.mp4"/>',
        ].join("\n"),
        downloadMedia: async (token, outputPath) => {
          downloaded.push({ token, outputPath });
          await writeFile(outputPath, "media");
        },
        log: () => {},
      },
    );

    expect(result).toBe(join(root, "with-lark-tags", "index.md"));
    expect(downloaded).toEqual([
      { token: "imageToken", outputPath: join(root, "with-lark-tags", "media", "imageToken.png") },
      { token: "fileToken", outputPath: join(root, "with-lark-tags", "media", "fileToken.mp4") },
    ]);
    expect(await Bun.file(result).text()).toBe([
      "# With Lark Tags",
      "",
      '<image token="imageToken" width="1024" height="768" src="./media/imageToken.png"/>',
      '<video token="fileToken" name="demo.mp4" src="./media/fileToken.mp4"/>',
    ].join("\n"));
  });

  test("keeps flat markdown path when media downloading is enabled but no media exists", async () => {
    const root = await mkdtemp(join(tmpdir(), "news-bot-"));
    tempDirs.push(root);

    const result = await runLarkDoc(
      { doc: "doc-token", out: root, downloadMedia: true },
      {},
      {
        fetchMarkdown: async () => "# No Media\n\nbody",
        log: () => {},
      },
    );

    expect(result).toBe(join(root, "no-media.md"));
    expect(await Bun.file(result).text()).toBe("# No Media\n\nbody");
  });

  test("does not download or rewrite media when disabled", async () => {
    const root = await mkdtemp(join(tmpdir(), "news-bot-"));
    tempDirs.push(root);
    let downloadCalled = false;

    const result = await runLarkDoc(
      { doc: "doc-token", out: root },
      {},
      {
        fetchMarkdown: async () =>
          "# With Media\n\n![image](https://example.feishu.cn/file?token=imageToken)",
        downloadMedia: async () => {
          downloadCalled = true;
        },
        log: () => {},
      },
    );

    expect(downloadCalled).toBe(false);
    expect(await Bun.file(result).text()).toBe(
      "# With Media\n\n![image](https://example.feishu.cn/file?token=imageToken)",
    );
  });
});
