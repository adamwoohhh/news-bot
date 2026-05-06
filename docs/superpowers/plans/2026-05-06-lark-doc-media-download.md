# Lark Doc Media Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add opt-in media downloading for `news-bot lark-doc`, storing media locally and rewriting Markdown references.

**Architecture:** Extend config with media options, add pure Markdown media helpers, add a `lark-cli docs +media-download` wrapper, then orchestrate the optional flow in `runLarkDoc`. Tests drive each behavior without invoking real Lark APIs.

**Tech Stack:** Bun, TypeScript, `bun:test`, Node `path`/`fs/promises`.

---

### Task 1: Config Options

**Files:**
- Modify: `src/config.ts`
- Test: `tests/config.test.ts`

- [ ] Write failing tests that `--download-media`, `--media-out`, `NEWS_BOT_LARK_DOC_DOWNLOAD_MEDIA=true`, and `NEWS_BOT_LARK_DOC_MEDIA_OUT` resolve into `downloadMedia` and `mediaOutDir`.
- [ ] Run `bun test tests/config.test.ts` and verify failures mention missing fields.
- [ ] Extend `LarkDocOptions` and `LarkDocConfig`, parse boolean env values, and default `mediaOutDir` to `<outDir>/media`.
- [ ] Run `bun test tests/config.test.ts` and verify pass.

### Task 2: Markdown Media Helpers

**Files:**
- Create: `src/media.ts`
- Test: `tests/media.test.ts`

- [ ] Write failing tests for extracting Lark media tokens from Markdown image/link URLs containing `file_token=...`, `token=...`, or `/media/<token>`.
- [ ] Write failing tests for rewriting matched links to relative local paths such as `./media/<token>`.
- [ ] Run `bun test tests/media.test.ts` and verify failures are due to missing helpers.
- [ ] Implement `findLarkMediaReferences(markdown)` and `rewriteLarkMediaReferences(markdown, replacements)`.
- [ ] Run `bun test tests/media.test.ts` and verify pass.

### Task 3: Lark Media Download Wrapper

**Files:**
- Modify: `src/lark.ts`
- Test: `tests/lark.test.ts`

- [ ] Write failing tests that a fake spawn receives `lark-cli docs +media-download --token <token> --type media --output <path>`.
- [ ] Write a failing test that non-zero exit codes throw `lark-cli docs +media-download failed`.
- [ ] Run `bun test tests/lark.test.ts` and verify failures are due to missing wrapper.
- [ ] Implement `downloadLarkDocMedia(token, outputPath, spawn = Bun.spawn)`.
- [ ] Run `bun test tests/lark.test.ts` and verify pass.

### Task 4: Command Orchestration

**Files:**
- Modify: `src/index.ts`
- Modify: `src/commands/lark-doc.ts`
- Test: `tests/lark-doc-command.test.ts`

- [ ] Write failing tests that `runLarkDoc` downloads each found media token, rewrites Markdown links, and writes rewritten Markdown.
- [ ] Write a failing test that no media directory work happens when media download is disabled.
- [ ] Run `bun test tests/lark-doc-command.test.ts` and verify failures show missing orchestration.
- [ ] Add CLI flags `--download-media` and `--media-out <dir>`.
- [ ] Inject `downloadMedia` into `runLarkDoc`, download referenced media to `mediaOutDir`, and rewrite links relative to the Markdown output directory.
- [ ] Run `bun test tests/lark-doc-command.test.ts` and verify pass.

### Task 5: Full Verification

**Files:**
- Modify as needed: `README.md`

- [ ] Add concise README usage for `--download-media` and `--media-out`.
- [ ] Run `bun test`.
- [ ] Run `bun run typecheck`.
- [ ] Run `git diff --check`.
