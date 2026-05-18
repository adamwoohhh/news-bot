import { describe, expect, test } from "bun:test";
import { resolveLarkDocConfig } from "../src/config.ts";

describe("resolveLarkDocConfig", () => {
  test("CLI flags win over environment variables", () => {
    const config = resolveLarkDocConfig(
      { doc: "cli-doc", out: "cli-out", downloadMedia: true, mediaOut: "cli-media" },
      {
        NEWS_BOT_LARK_DOC: "env-doc",
        NEWS_BOT_LARK_DOC_OUT: "env-out",
        NEWS_BOT_LARK_DOC_DOWNLOAD_MEDIA: "false",
        NEWS_BOT_LARK_DOC_MEDIA_OUT: "env-media",
      },
    );
    expect(config).toEqual({
      doc: "cli-doc",
      outDir: "cli-out",
      downloadMedia: true,
      mediaOutDir: "cli-media",
      larkCliOptions: {},
    });
  });

  test("environment variables fill missing CLI flags", () => {
    const config = resolveLarkDocConfig(
      {},
      {
        NEWS_BOT_LARK_DOC: "env-doc",
        NEWS_BOT_LARK_DOC_OUT: "env-out",
        NEWS_BOT_LARK_DOC_DOWNLOAD_MEDIA: "true",
        NEWS_BOT_LARK_DOC_MEDIA_OUT: "env-media",
      },
    );
    expect(config).toEqual({
      doc: "env-doc",
      outDir: "env-out",
      downloadMedia: true,
      mediaOutDir: "env-media",
      larkCliOptions: {},
    });
  });

  test("output and media options default when omitted", () => {
    const config = resolveLarkDocConfig({ doc: "cli-doc" }, {});
    expect(config).toEqual({
      doc: "cli-doc",
      outDir: ".",
      downloadMedia: false,
      mediaOutDir: "media",
      larkCliOptions: {},
    });
  });

  test("throws when doc is missing", () => {
    expect(() => resolveLarkDocConfig({}, {})).toThrow("Missing required document");
  });

  test("keeps lark-cli passthrough flags separate from news-bot config", () => {
    const config = resolveLarkDocConfig(
      {
        doc: "cli-doc",
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
      {},
    );

    expect(config.larkCliOptions).toEqual({
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
    });
  });
});
