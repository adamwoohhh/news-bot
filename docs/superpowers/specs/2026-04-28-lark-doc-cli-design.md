# news-bot lark-doc CLI Design

## Goal

Build a Bun-based command line tool named `news-bot` with a `lark-doc` subcommand. The subcommand fetches a Lark document as Markdown through `lark-cli docs +fetch --format pretty`, derives a local Markdown filename from the first H1 title, and writes the result into a target folder.

## Command Shape

Primary usage:

```bash
news-bot lark-doc --doc "<lark-doc-url-or-token>" --out "./docs"
```

Configuration can come from CLI flags or local environment variables:

```bash
NEWS_BOT_LARK_DOC="<lark-doc-url-or-token>"
NEWS_BOT_LARK_DOC_OUT="./docs"
```

Precedence is:

```text
CLI flag > environment variable > default value or validation error
```

The `--doc` value is required after fallback resolution. The `--out` value defaults to the current working directory if neither CLI nor environment provides it.

## Behavior

`news-bot lark-doc` executes:

```bash
lark-cli docs +fetch --doc "<doc>" --format pretty
```

The command treats stdout as Markdown. It extracts the first H1 heading from the Markdown, using the first line that matches a single leading `#`, such as:

```markdown
# Document Title
```

The heading text becomes the base filename. If the title contains Chinese characters, the Chinese text is converted to pinyin. The filename is normalized by lowercasing, removing filesystem-unsafe characters, and converting whitespace or separator runs to `-`. The final file extension is `.md`.

If no H1 exists, the command uses a timestamp fallback name:

```text
lark-doc-YYYYMMDD-HHmmss.md
```

The output directory is created automatically. If a file with the target name already exists, the command writes to the next available suffix, such as `title-2.md` or `title-3.md`, rather than overwriting.

After a successful write, the CLI prints the final file path.

## Error Handling

The command fails without writing a file when:

- `--doc` and `NEWS_BOT_LARK_DOC` are both missing.
- `lark-cli` is unavailable.
- `lark-cli docs +fetch` exits unsuccessfully.
- The fetched Markdown is empty.
- The output path cannot be created or written.

For `lark-cli` failures, stderr should be preserved in the user-facing error where possible.

## Implementation Approach

Use Bun, TypeScript, and `commander`.

Planned modules:

- CLI entrypoint: parse `news-bot lark-doc` and resolve configuration.
- Lark fetcher: run `lark-cli docs +fetch --format pretty`.
- Markdown title parser: extract first H1 title.
- Filename builder: convert Chinese to pinyin, sanitize names, and handle fallback names.
- File writer: create the output folder and choose a non-conflicting destination path.

The implementation should keep logic testable by isolating shell execution and filesystem writes from pure parsing and naming functions.

## Tests

Test coverage should include:

- First H1 extraction.
- Ignoring non-H1 headings such as `##`.
- Chinese title conversion to pinyin.
- Filename sanitization for unsafe characters.
- CLI flag and environment variable precedence.
- Missing document validation.
- File conflict suffixing.
- Mocked `lark-cli` execution success and failure.

Tests should not call real Lark APIs.

