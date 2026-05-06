# news-bot lark-doc CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Bun TypeScript CLI named `news-bot` with a `lark-doc` subcommand that fetches Lark docs as Markdown and writes them to a filename derived from the first H1.

**Architecture:** The CLI entrypoint parses command options and environment fallback, then delegates to small focused modules. Pure modules handle Markdown title extraction and filename generation; side-effect modules handle `lark-cli` execution and filesystem writes.

**Tech Stack:** Bun, TypeScript, commander, pinyin-pro, Bun test.

---

## File Structure

- `package.json`: project metadata, binary mapping, scripts, dependencies.
- `tsconfig.json`: TypeScript settings for Bun.
- `src/index.ts`: executable CLI entrypoint and `commander` command wiring.
- `src/config.ts`: resolves CLI flags and environment variables.
- `src/markdown.ts`: extracts the first H1 title from Markdown.
- `src/filename.ts`: converts titles to safe Markdown filenames.
- `src/lark.ts`: runs `lark-cli docs +fetch --format pretty`.
- `src/writer.ts`: creates output folders and writes non-conflicting files.
- `src/commands/lark-doc.ts`: orchestrates fetch, naming, and writing.
- `tests/*.test.ts`: focused tests for pure logic and orchestration.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts`

- [ ] **Step 1: Create package metadata**

Create `package.json`:

```json
{
  "name": "news-bot",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "news-bot": "./src/index.ts"
  },
  "scripts": {
    "test": "bun test",
    "typecheck": "bunx tsc --noEmit"
  },
  "dependencies": {
    "commander": "^12.1.0",
    "pinyin-pro": "^3.26.0"
  },
  "devDependencies": {
    "@types/bun": "^1.2.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "types": ["bun"],
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

- [ ] **Step 3: Create minimal CLI entrypoint**

Create `src/index.ts`:

```ts
#!/usr/bin/env bun

import { Command } from "commander";

const program = new Command();

program
  .name("news-bot")
  .description("Utilities for fetching and processing news-related content.")
  .version("0.1.0");

program
  .command("lark-doc")
  .description("Fetch a Lark document as Markdown and write it to a local file.")
  .option("--doc <doc>", "Lark document URL or token")
  .option("--out <dir>", "Output directory")
  .action(() => {
    console.error("lark-doc is not implemented yet.");
    process.exitCode = 1;
  });

program.parseAsync();
```

- [ ] **Step 4: Install dependencies**

Run: `bun install`

Expected: `bun.lock` is created and dependencies install successfully.

## Task 2: Markdown Title Extraction

**Files:**
- Create: `src/markdown.ts`
- Create: `tests/markdown.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/markdown.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/markdown.test.ts`

Expected: FAIL because `src/markdown.ts` does not exist.

- [ ] **Step 3: Implement title extraction**

Create `src/markdown.ts`:

```ts
export function extractFirstH1(markdown: string): string | undefined {
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\s{0,3}#(?!#)\s+(.+?)\s*$/);
    if (!match) continue;

    const title = match[1]?.trim();
    if (title) return title;
  }

  return undefined;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/markdown.test.ts`

Expected: PASS.

## Task 3: Filename Builder

**Files:**
- Create: `src/filename.ts`
- Create: `tests/filename.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/filename.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { buildMarkdownFilename } from "../src/filename.ts";

describe("buildMarkdownFilename", () => {
  test("converts Chinese titles to pinyin", () => {
    expect(buildMarkdownFilename("需求文档")).toBe("xu-qiu-wen-dang.md");
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/filename.test.ts`

Expected: FAIL because `src/filename.ts` does not exist.

- [ ] **Step 3: Implement filename builder**

Create `src/filename.ts`:

```ts
import { pinyin } from "pinyin-pro";

const CHINESE_RE = /[\u3400-\u9fff]/;

export function buildMarkdownFilename(title: string | undefined, now = new Date()): string {
  const base = title ? normalizeTitle(title) : "";
  const safeBase = base || fallbackBase(now);
  return `${safeBase}.md`;
}

function normalizeTitle(title: string): string {
  const romanized = CHINESE_RE.test(title)
    ? pinyin(title, { toneType: "none", type: "array" }).join(" ")
    : title;

  return romanized
    .toLowerCase()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/[-_.]{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^\.+|\.+$/g, "");
}

function fallbackBase(now: Date): string {
  const iso = now.toISOString();
  const date = iso.slice(0, 10).replaceAll("-", "");
  const time = iso.slice(11, 19).replaceAll(":", "");
  return `lark-doc-${date}-${time}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/filename.test.ts`

Expected: PASS.

## Task 4: Config Resolution

**Files:**
- Create: `src/config.ts`
- Create: `tests/config.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/config.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/config.test.ts`

Expected: FAIL because `src/config.ts` does not exist.

- [ ] **Step 3: Implement config resolution**

Create `src/config.ts`:

```ts
export type LarkDocOptions = {
  doc?: string;
  out?: string;
};

export type LarkDocConfig = {
  doc: string;
  outDir: string;
};

export function resolveLarkDocConfig(
  options: LarkDocOptions,
  env: Record<string, string | undefined> = process.env,
): LarkDocConfig {
  const doc = firstNonEmpty(options.doc, env.NEWS_BOT_LARK_DOC);
  const outDir = firstNonEmpty(options.out, env.NEWS_BOT_LARK_DOC_OUT) ?? ".";

  if (!doc) {
    throw new Error(
      "Missing required document. Pass --doc <url-or-token> or set NEWS_BOT_LARK_DOC.",
    );
  }

  return { doc, outDir };
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/config.test.ts`

Expected: PASS.

## Task 5: Lark Fetcher and File Writer

**Files:**
- Create: `src/lark.ts`
- Create: `src/writer.ts`
- Create: `tests/writer.test.ts`

- [ ] **Step 1: Write failing writer tests**

Create `tests/writer.test.ts`:

```ts
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { writeUniqueMarkdownFile } from "../src/writer.ts";

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

describe("writeUniqueMarkdownFile", () => {
  test("creates the output directory and writes markdown", async () => {
    const root = await mkdtemp(join(tmpdir(), "news-bot-"));
    tempDirs.push(root);

    const output = await writeUniqueMarkdownFile(join(root, "nested"), "title.md", "# Title");
    expect(output.endsWith("nested/title.md")).toBe(true);
    expect(await Bun.file(output).text()).toBe("# Title");
  });

  test("adds numeric suffix when file already exists", async () => {
    const root = await mkdtemp(join(tmpdir(), "news-bot-"));
    tempDirs.push(root);
    await writeFile(join(root, "title.md"), "existing");

    const output = await writeUniqueMarkdownFile(root, "title.md", "new");
    expect(output.endsWith("title-2.md")).toBe(true);
    expect(await Bun.file(output).text()).toBe("new");
  });
});
```

- [ ] **Step 2: Run writer test to verify it fails**

Run: `bun test tests/writer.test.ts`

Expected: FAIL because `src/writer.ts` does not exist.

- [ ] **Step 3: Implement file writer**

Create `src/writer.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, parse } from "node:path";

export async function writeUniqueMarkdownFile(
  outDir: string,
  filename: string,
  markdown: string,
): Promise<string> {
  await mkdir(outDir, { recursive: true });

  const { name } = parse(filename);
  const ext = extname(filename) || ".md";
  let candidate = join(outDir, `${name}${ext}`);
  let suffix = 2;

  while (existsSync(candidate)) {
    candidate = join(outDir, `${name}-${suffix}${ext}`);
    suffix += 1;
  }

  await writeFile(candidate, markdown, "utf8");
  return candidate;
}
```

- [ ] **Step 4: Implement Lark fetcher**

Create `src/lark.ts`:

```ts
export async function fetchLarkDocMarkdown(doc: string): Promise<string> {
  const proc = Bun.spawn(["lark-cli", "docs", "+fetch", "--doc", doc, "--format", "pretty"], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    const detail = stderr.trim() || stdout.trim() || `exit code ${exitCode}`;
    throw new Error(`lark-cli docs +fetch failed: ${detail}`);
  }

  const markdown = stdout.trim();
  if (!markdown) {
    throw new Error("Fetched Markdown is empty.");
  }

  return markdown;
}
```

- [ ] **Step 5: Run writer test to verify it passes**

Run: `bun test tests/writer.test.ts`

Expected: PASS.

## Task 6: Orchestration and CLI Wiring

**Files:**
- Create: `src/commands/lark-doc.ts`
- Modify: `src/index.ts`
- Create: `tests/lark-doc-command.test.ts`

- [ ] **Step 1: Write orchestration tests**

Create `tests/lark-doc-command.test.ts`:

```ts
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
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
});
```

- [ ] **Step 2: Run orchestration test to verify it fails**

Run: `bun test tests/lark-doc-command.test.ts`

Expected: FAIL because `src/commands/lark-doc.ts` does not exist.

- [ ] **Step 3: Implement orchestration**

Create `src/commands/lark-doc.ts`:

```ts
import { resolveLarkDocConfig, type LarkDocOptions } from "../config.ts";
import { buildMarkdownFilename } from "../filename.ts";
import { fetchLarkDocMarkdown } from "../lark.ts";
import { extractFirstH1 } from "../markdown.ts";
import { writeUniqueMarkdownFile } from "../writer.ts";

type RunDeps = {
  fetchMarkdown?: (doc: string) => Promise<string>;
  log?: (message: string) => void;
};

export async function runLarkDoc(
  options: LarkDocOptions,
  env: Record<string, string | undefined> = process.env,
  deps: RunDeps = {},
): Promise<string> {
  const config = resolveLarkDocConfig(options, env);
  const fetchMarkdown = deps.fetchMarkdown ?? fetchLarkDocMarkdown;
  const log = deps.log ?? console.log;

  const markdown = (await fetchMarkdown(config.doc)).trim();
  if (!markdown) {
    throw new Error("Fetched Markdown is empty.");
  }

  const title = extractFirstH1(markdown);
  const filename = buildMarkdownFilename(title);
  const outputPath = await writeUniqueMarkdownFile(config.outDir, filename, markdown);

  log(outputPath);
  return outputPath;
}
```

- [ ] **Step 4: Wire real CLI entrypoint**

Replace `src/index.ts` with:

```ts
#!/usr/bin/env bun

import { Command } from "commander";
import { runLarkDoc } from "./commands/lark-doc.ts";

const program = new Command();

program
  .name("news-bot")
  .description("Utilities for fetching and processing news-related content.")
  .version("0.1.0");

program
  .command("lark-doc")
  .description("Fetch a Lark document as Markdown and write it to a local file.")
  .option("--doc <doc>", "Lark document URL or token. Falls back to NEWS_BOT_LARK_DOC.")
  .option("--out <dir>", "Output directory. Falls back to NEWS_BOT_LARK_DOC_OUT, then current directory.")
  .action(async (options: { doc?: string; out?: string }) => {
    try {
      await runLarkDoc(options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exitCode = 1;
    }
  });

await program.parseAsync();
```

- [ ] **Step 5: Run orchestration test to verify it passes**

Run: `bun test tests/lark-doc-command.test.ts`

Expected: PASS.

## Task 7: Final Verification

**Files:**
- Modify only if verification reveals issues.

- [ ] **Step 1: Run all tests**

Run: `bun test`

Expected: all tests pass.

- [ ] **Step 2: Run typecheck**

Run: `bunx tsc --noEmit`

Expected: no TypeScript errors.

- [ ] **Step 3: Verify help output**

Run: `bun run src/index.ts --help`

Expected: output includes `news-bot`, `lark-doc`, and global help.

- [ ] **Step 4: Verify subcommand validation**

Run: `bun run src/index.ts lark-doc`

Expected: exits with an error containing `Missing required document`.

- [ ] **Step 5: Verify mocked path manually**

Create a temporary fake `lark-cli` earlier in `PATH` that prints:

```markdown
# 需求文档

body
```

Run:

```bash
PATH="/tmp/news-bot-fake-bin:$PATH" bun run src/index.ts lark-doc --doc fake --out /tmp/news-bot-output
```

Expected: prints `/tmp/news-bot-output/xu-qiu-wen-dang.md`, and that file contains the Markdown.

