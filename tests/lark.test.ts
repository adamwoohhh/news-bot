import { describe, expect, test } from "bun:test";
import { downloadLarkDocMedia, fetchLarkDocMarkdown } from "../src/lark.ts";

describe("fetchLarkDocMarkdown", () => {
  test("invokes lark-cli docs fetch with pretty format by default", async () => {
    let args: string[] | undefined;

    await fetchLarkDocMarkdown("doc-token", {}, (spawnArgs) => {
      args = spawnArgs;
      return {
        stdout: textStream("# Title"),
        stderr: textStream(""),
        exited: Promise.resolve(0),
      };
    });

    expect(args).toEqual([
      "lark-cli",
      "docs",
      "+fetch",
      "--doc",
      "doc-token",
      "--format",
      "pretty",
    ]);
  });

  test("passes through lark-cli global flags to docs fetch", async () => {
    let args: string[] | undefined;

    await fetchLarkDocMarkdown(
      "doc-token",
      {
        params: "{\"a\":1}",
        data: "{\"b\":2}",
        as: "user",
        format: "json",
        pageAll: true,
        pageSize: "50",
        pageLimit: "3",
        pageDelay: "100",
        output: "/tmp/out.json",
        jq: ".data",
        dryRun: true,
        profile: "dev",
      },
      (spawnArgs) => {
        args = spawnArgs;
        return {
          stdout: textStream("# Title"),
          stderr: textStream(""),
          exited: Promise.resolve(0),
        };
      },
    );

    expect(args).toEqual([
      "lark-cli",
      "docs",
      "+fetch",
      "--doc",
      "doc-token",
      "--params",
      "{\"a\":1}",
      "--data",
      "{\"b\":2}",
      "--as",
      "user",
      "--format",
      "json",
      "--page-all",
      "--page-size",
      "50",
      "--page-limit",
      "3",
      "--page-delay",
      "100",
      "--output",
      "/tmp/out.json",
      "--jq",
      ".data",
      "--dry-run",
      "--profile",
      "dev",
    ]);
  });
});

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
