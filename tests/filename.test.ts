import { describe, expect, test } from "bun:test";
import { buildMarkdownFilename } from "../src/filename.ts";

describe("buildMarkdownFilename", () => {
  test("converts Chinese titles to pinyin", () => {
    expect(buildMarkdownFilename("需求文档")).toBe("xu-qiu-wen-dang.md");
  });

  test("handles mixed ascii words Chinese punctuation and Chinese words", () => {
    expect(buildMarkdownFilename("MCP、Skill 与 CLI 的工程化实践")).toBe(
      "mcp-skill-yu-cli-de-gong-cheng-hua-shi-jian.md",
    );
  });

  test("sanitizes unsafe filename characters", () => {
    expect(buildMarkdownFilename('A/B:C*D?E"F<G>H|I')).toBe("a-b-c-d-e-f-g-h-i.md");
  });

  test("keeps useful ascii words and normalizes separators", () => {
    expect(buildMarkdownFilename("Launch Plan 2026")).toBe("launch-plan-2026.md");
  });

  test("uses fallback when title sanitizes to empty", () => {
    expect(buildMarkdownFilename("////", new Date("2026-04-28T12:34:56+08:00"))).toBe(
      "lark-doc-20260428-043456.md",
    );
  });
});
