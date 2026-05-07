# Repository Guidelines

## Project Structure & Module Organization

This is a Bun-based TypeScript CLI. Source files live in `src/`, with the executable entry point at `src/index.ts`. Command implementations belong under `src/commands/`; shared helpers for configuration, Lark access, Markdown parsing, filename generation, and writing live as top-level modules in `src/`. Tests are in `tests/` and mirror the module being tested, for example `tests/filename.test.ts`. Documentation is in `README.md` and `docs/README.zh-CN.md`; design notes are under `docs/superpowers/`. Build artifacts go to `dist/`.

## Build, Test, and Development Commands

- `bun install`: install runtime and dev dependencies.
- `bun run typecheck`: run `tsc --noEmit` using the strict TypeScript config.
- `bun test`: run the Bun test suite in `tests/`.
- `bun run build`: compile a standalone binary for the current platform at `dist/news-bot`.
- `bun run build:linux-x64`, `bun run build:darwin-arm64`, etc.: produce release binaries for specific targets.

For local CLI checks after building, run:

```bash
dist/news-bot lark-doc --doc "https://xxx.feishu.cn/docx/..." --out ./docs
```

The `lark-doc` command shells out to `lark-cli docs +fetch`, so `lark-cli` must be installed and authenticated for end-to-end testing.

## Coding Style & Naming Conventions

Use TypeScript ES modules with explicit `.ts` import extensions. Keep `strict` TypeScript clean. Use two-space indentation, double quotes, semicolons, and trailing commas for multi-line calls or object literals. Prefer small pure helpers in `src/*.ts` and inject dependencies for command behavior to keep tests isolated. Name files and CLI commands in kebab-case (`lark-doc.ts`), exported functions in camelCase (`runLarkDoc`), and types in PascalCase (`LarkDocOptions`).

## Testing Guidelines

Tests use `bun:test` with `describe`, `test`, and `expect`. Add focused unit tests next to related coverage in `tests/<module>.test.ts`. For command tests, mock external effects such as Lark fetches and logging instead of invoking real network or CLI dependencies. Run both `bun test` and `bun run typecheck` before handing off changes.

When adding a substantial user-facing feature, or making a behavior change that materially affects documented usage, update `README.md` in the same change so usage and behavior descriptions stay current. If the feature also affects Chinese-language users, update `docs/README.zh-CN.md` as well. Routine bugfixes do not require README updates unless they change documented behavior or correct an inaccurate existing description.

## Commit & Pull Request Guidelines

The current history uses Conventional Commit style (`feat: init`). Continue with short, imperative messages such as `fix: handle empty lark document` or `test: cover filename collisions`. Pull requests should include a concise summary, the commands run for verification, linked issues when applicable, and screenshots or terminal output only when user-visible CLI behavior changes.

## Security & Configuration Tips

Do not commit credentials, downloaded private documents, or local `.env` files. Prefer `NEWS_BOT_LARK_DOC` and `NEWS_BOT_LARK_DOC_OUT` for local configuration, and avoid logging document contents unless needed for debugging.

## Agent-Specific Instructions

Before changing code or behavior, classify the request:

- For a new feature or behavior change, use `superpowers:brainstorming` first to clarify intent and scope, then use `superpowers:test-driven-development` for implementation.
- For a bugfix, use `superpowers:systematic-debugging` first to identify the root cause, then use `superpowers:test-driven-development` for the fix.
- If it is unclear whether the request is a bugfix, a new feature, or a small maintenance edit, ask the user whether they want the relevant `superpowers` workflow executed before implementation.

Always finish with `superpowers:verification-before-completion` before reporting completion.
