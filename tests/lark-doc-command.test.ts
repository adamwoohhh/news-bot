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

    expect(downloaded).toEqual([
      { token: "imageToken", outputPath: join(root, "media", "imageToken") },
    ]);
    expect(await Bun.file(result).text()).toBe("# With Media\n\n![image](./media/imageToken)");
  });

  test("downloads media from lark image and file tags", async () => {
    const root = await mkdtemp(join(tmpdir(), "news-bot-"));
    tempDirs.push(root);
    const downloaded: Array<{ token: string; outputPath: string }> = [];

    await runLarkDoc(
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

    expect(downloaded).toEqual([
      { token: "imageToken", outputPath: join(root, "media", "imageToken") },
      { token: "fileToken", outputPath: join(root, "media", "fileToken") },
    ]);
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
