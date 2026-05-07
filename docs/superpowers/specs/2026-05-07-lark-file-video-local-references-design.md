# Lark File Video Local References Design

## Goal

When `news-bot lark-doc --download-media` downloads media referenced by Lark native tags, rewrite those tags so the saved Markdown points at the downloaded local files.

## User-Facing Behavior

Markdown link rewriting remains unchanged.

For Lark native tags, media references with downloaded local replacements receive a `src` attribute. Existing attributes are preserved, and an existing `src` attribute is replaced with the local path.

`<file />` tags need one special case: if the file is a video, the output tag becomes `<video />`. Video detection is based on a video file extension in the `name` attribute or the original `src` attribute. Common supported extensions are `.mp4`, `.mov`, `.m4v`, `.webm`, `.avi`, and `.mkv`.

Non-video `<file />` tags remain `<file />` tags and still receive the local `src` attribute.

## Architecture

Keep the existing command orchestration in `src/commands/lark-doc.ts`. The download flow already builds a token-to-local-path map and calls `rewriteLarkMediaReferences`.

Extend `src/media.ts` so `rewriteLarkMediaReferences` rewrites Lark native `<image />` and `<file />` tags in addition to Markdown URLs. Attribute parsing stays local to the media helper.

## Testing

Add focused `bun:test` coverage in `tests/media.test.ts` for:

- video `<file />` tags becoming `<video />` with preserved attributes and local `src`;
- existing `src` attributes being replaced;
- non-video `<file />` tags remaining `<file />` with local `src`;
- `<image />` tags receiving local `src`.
