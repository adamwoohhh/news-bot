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

  test("extracts media tokens from lark image and file tags", () => {
    const markdown = [
      '<image token="imageToken" width="1024" height="768"/>',
      '<file token="fileToken" name="demo.mp4"/>',
    ].join("\n");

    expect(findLarkMediaReferences(markdown)).toEqual([
      { token: "imageToken" },
      { token: "fileToken" },
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

  test("adds local src to lark image tags", () => {
    const markdown = '<image token="imageToken" width="1024" height="768"/>';

    const rewritten = rewriteLarkMediaReferences(markdown, new Map([
      ["imageToken", "./media/imageToken"],
    ]));

    expect(rewritten).toBe(
      '<image token="imageToken" width="1024" height="768" src="./media/imageToken"/>',
    );
  });

  test("rewrites video file tags to video tags while preserving attributes", () => {
    const markdown = '<file token="videoToken" name="demo.mp4" size="123"/>';

    const rewritten = rewriteLarkMediaReferences(markdown, new Map([
      ["videoToken", "./media/videoToken"],
    ]));

    expect(rewritten).toBe(
      '<video token="videoToken" name="demo.mp4" size="123" src="./media/videoToken"/>',
    );
  });

  test("replaces existing src when rewriting video file tags", () => {
    const markdown = '<file token="videoToken" name="demo.mp4" src="https://example.feishu.cn/file"/>';

    const rewritten = rewriteLarkMediaReferences(markdown, new Map([
      ["videoToken", "./media/videoToken"],
    ]));

    expect(rewritten).toBe(
      '<video token="videoToken" name="demo.mp4" src="./media/videoToken"/>',
    );
  });

  test("keeps non-video file tags as file tags with local src", () => {
    const markdown = '<file token="fileToken" name="demo.pdf"/>';

    const rewritten = rewriteLarkMediaReferences(markdown, new Map([
      ["fileToken", "./media/fileToken"],
    ]));

    expect(rewritten).toBe('<file token="fileToken" name="demo.pdf" src="./media/fileToken"/>');
  });
});
