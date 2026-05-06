# Lark Doc Media Download Design

## Goal

Add optional media download support to `news-bot lark-doc`. When enabled, the command downloads multimedia resources referenced by the fetched Lark Markdown, stores them locally, and rewrites Markdown links to point at the downloaded files.

## User-Facing Behavior

The default command remains unchanged:

```bash
news-bot lark-doc --doc <doc> --out ./docs
```

Media download is opt-in:

```bash
news-bot lark-doc --doc <doc> --out ./docs --download-media
news-bot lark-doc --doc <doc> --out ./docs --download-media --media-out ./assets
```

Configuration sources follow the existing CLI-over-environment pattern:

- `--download-media` or `NEWS_BOT_LARK_DOC_DOWNLOAD_MEDIA=true`
- `--media-out <dir>` or `NEWS_BOT_LARK_DOC_MEDIA_OUT=<dir>`

If `--media-out` is omitted, media files are stored in `media/` under the Markdown output directory. Markdown references are rewritten as relative paths so the output directory can be moved as a unit.

## Architecture

`src/config.ts` will extend `LarkDocOptions` and `LarkDocConfig` with `downloadMedia` and `mediaOutDir`.

`src/media.ts` will provide pure helpers to find Lark media references in Markdown, derive stable local filenames from tokens, and rewrite matched references to relative local paths.

`src/lark.ts` will add a `downloadLarkDocMedia(token, outputPath)` wrapper around:

```bash
lark-cli docs +media-download --token <token> --type media --output <outputPath>
```

`src/commands/lark-doc.ts` will orchestrate the flow: fetch Markdown, optionally download media, rewrite links, derive the Markdown filename, then write the final Markdown file.

## Error Handling

When media download is enabled, any failed `lark-cli docs +media-download` call fails the command. This prevents writing Markdown that references missing local files. If no media references are found, the command writes Markdown normally and does not create the media directory.

## Testing

Add unit tests for config resolution, media reference extraction and rewriting, and command orchestration. Command tests will inject a fake media downloader instead of invoking `lark-cli`. Existing tests for the default no-media path must continue to pass.
