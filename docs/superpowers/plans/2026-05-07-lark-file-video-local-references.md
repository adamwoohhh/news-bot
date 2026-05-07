# Lark File Video Local References Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite downloaded Lark native media tags to local references, converting only video `<file />` tags to `<video />`.

**Architecture:** Keep command orchestration unchanged. Add pure tag rewriting behavior to `src/media.ts`, driven by focused tests in `tests/media.test.ts`.

**Tech Stack:** Bun, TypeScript ES modules, `bun:test`.

---

### Task 1: Media Tag Rewriting

**Files:**
- Modify: `tests/media.test.ts`
- Modify: `src/media.ts`

- [ ] **Step 1: Write failing tests**

Add tests that call `rewriteLarkMediaReferences` with a token replacement map and verify local `src` handling for `<image />`, non-video `<file />`, video `<file />`, and replacement of an existing `src`.

- [ ] **Step 2: Run tests and verify failure**

Run: `bun test tests/media.test.ts`

Expected: failures show Lark native tags are not rewritten yet.

- [ ] **Step 3: Implement minimal tag rewriting**

In `src/media.ts`, extend `rewriteLarkMediaReferences` to also replace matched Lark native tags. Preserve attributes, add or replace `src`, and rename only video file tags to `video`.

- [ ] **Step 4: Run targeted tests**

Run: `bun test tests/media.test.ts`

Expected: all tests in `tests/media.test.ts` pass.

- [ ] **Step 5: Run full verification**

Run: `bun test`

Run: `bun run typecheck`

Expected: both commands exit with code 0.
