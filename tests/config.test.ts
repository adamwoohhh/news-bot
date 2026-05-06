import { describe, expect, test } from "bun:test";
import { resolveLarkDocConfig } from "../src/config.ts";

describe("resolveLarkDocConfig", () => {
  test("CLI flags win over environment variables", () => {
    const config = resolveLarkDocConfig(
      { doc: "cli-doc", out: "cli-out" },
      { NEWS_BOT_LARK_DOC: "env-doc", NEWS_BOT_LARK_DOC_OUT: "env-out" },
    );
    expect(config).toEqual({ doc: "cli-doc", outDir: "cli-out" });
  });

  test("environment variables fill missing CLI flags", () => {
    const config = resolveLarkDocConfig(
      {},
      { NEWS_BOT_LARK_DOC: "env-doc", NEWS_BOT_LARK_DOC_OUT: "env-out" },
    );
    expect(config).toEqual({ doc: "env-doc", outDir: "env-out" });
  });

  test("output directory defaults to current directory", () => {
    const config = resolveLarkDocConfig({ doc: "cli-doc" }, {});
    expect(config).toEqual({ doc: "cli-doc", outDir: "." });
  });

  test("throws when doc is missing", () => {
    expect(() => resolveLarkDocConfig({}, {})).toThrow("Missing required document");
  });
});
