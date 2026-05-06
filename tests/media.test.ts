import { describe, expect, test } from "bun:test";
import { findLarkMediaReferences, rewriteLarkMediaReferences } from "../src/media.ts";

describe("findLarkMediaReferences", () => {
  test("extracts media tokens from markdown links", () => {
    const markdown = [
      "![img](https://example.feishu.cn/space/api/box/stream/download?file_token=boxcnImage)",
      "[file](https://example.feishu.cn/file?token=fileToken123)",
      "![media](https://example.feishu.cn/media/mediaToken456)",
    ].join("\n");

    expect(findLarkMediaReferences(markdown)).toEqual([
      {
        token: "boxcnImage",
        originalUrl:
          "https://example.feishu.cn/space/api/box/stream/download?file_token=boxcnImage",
      },
      {
        token: "fileToken123",
        originalUrl: "https://example.feishu.cn/file?token=fileToken123",
      },
      {
        token: "mediaToken456",
        originalUrl: "https://example.feishu.cn/media/mediaToken456",
      },
    ]);
  });

  test("deduplicates repeated media tokens", () => {
    const markdown = [
      "![a](https://example.feishu.cn/file?token=sameToken)",
      "![b](https://example.feishu.cn/file?token=sameToken)",
    ].join("\n");

    expect(findLarkMediaReferences(markdown)).toEqual([
      {
        token: "sameToken",
        originalUrl: "https://example.feishu.cn/file?token=sameToken",
      },
    ]);
  });
});

describe("rewriteLarkMediaReferences", () => {
  test("rewrites matched markdown URLs to local relative paths", () => {
    const markdown = [
      "![img](https://example.feishu.cn/file?token=imageToken)",
      "[file](https://example.feishu.cn/file?file_token=fileToken)",
    ].join("\n");

    const rewritten = rewriteLarkMediaReferences(markdown, new Map([
      ["imageToken", "./media/imageToken.png"],
      ["fileToken", "./media/fileToken.pdf"],
    ]));

    expect(rewritten).toBe("![img](./media/imageToken.png)\n[file](./media/fileToken.pdf)");
  });
});
