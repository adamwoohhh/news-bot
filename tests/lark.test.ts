import { describe, expect, test } from "bun:test";
import { downloadLarkDocMedia } from "../src/lark.ts";

describe("downloadLarkDocMedia", () => {
  test("invokes lark-cli media download with token and output path", async () => {
    let args: string[] | undefined;

    await downloadLarkDocMedia("mediaToken", "/tmp/media-file", (spawnArgs) => {
      args = spawnArgs;
      return {
        stdout: textStream(""),
        stderr: textStream(""),
        exited: Promise.resolve(0),
      };
    });

    expect(args).toEqual([
      "lark-cli",
      "docs",
      "+media-download",
      "--token",
      "mediaToken",
      "--type",
      "media",
      "--output",
      "/tmp/media-file",
    ]);
  });

  test("throws when lark-cli media download fails", async () => {
    await expect(
      downloadLarkDocMedia("mediaToken", "/tmp/media-file", (() => ({
        stdout: textStream(""),
        stderr: textStream("bad token"),
        exited: Promise.resolve(1),
      })),
    )
    ).rejects.toThrow("lark-cli docs +media-download failed: bad token");
  });
});

function textStream(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}
