import { describe, expect, test } from "bun:test";
import { extractFirstH1 } from "../src/markdown.ts";

describe("extractFirstH1", () => {
  test("returns the first single-hash heading", () => {
    const markdown = "intro\n\n## Skip\n\n# Main Title\n\n# Later";
    expect(extractFirstH1(markdown)).toBe("Main Title");
  });

  test("ignores empty headings and non-H1 headings", () => {
    const markdown = "#   \n\n### Detail\n\n## Section";
    expect(extractFirstH1(markdown)).toBeUndefined();
  });

  test("supports leading whitespace before H1", () => {
    expect(extractFirstH1("  #  需求文档  \ncontent")).toBe("需求文档");
  });
});
