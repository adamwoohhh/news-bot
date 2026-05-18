# news-bot

Bun-based CLI source project for fetching Lark documents.

## Documentation

- [English](README.md)
- [简体中文](docs/README.zh-CN.md)

## Install

End users can install the latest macOS or Linux binary from GitHub Releases:

```bash
curl -fsSL https://github.com/adamwoohhh/news-bot/releases/latest/download/install.sh | bash
```

Install a specific version:

```bash
curl -fsSLO https://github.com/adamwoohhh/news-bot/releases/latest/download/install.sh
NEWS_BOT_VERSION=v0.1.0 bash install.sh
```

The installer writes to `~/.local/bin/news-bot` by default. Override the install directory with:

```bash
NEWS_BOT_INSTALL_DIR=/usr/local/bin bash install.sh
```

For mirrors or internal release hosting, override the release asset base URL:

```bash
NEWS_BOT_BASE_URL=https://example.com/news-bot/v0.1.0 bash install.sh
```

The `lark-doc` command requires `lark-cli` to be installed and authenticated on the user's machine.

## Update Checks

`news-bot` checks GitHub Releases for a newer version after successful commands. The check is cached at `~/.cache/news-bot/update-check.json` and runs at most once every 24 hours. Update notices are written to stderr so command stdout stays machine-readable.

Disable automatic checks for one run:

```bash
news-bot --no-update-check lark-doc --doc "https://xxx.feishu.cn/docx/..." --out ./docs
```

Disable automatic checks with an environment variable:

```bash
NEWS_BOT_NO_UPDATE_CHECK=1 news-bot lark-doc --doc "https://xxx.feishu.cn/docx/..." --out ./docs
```

CI environments skip automatic checks by default. To check manually:

```bash
news-bot update-check
```

## Build Standalone Binary

Developers need Bun to build the executable:

```bash
bun install
bun run build
```

This creates:

```text
dist/news-bot
```

End users can run `dist/news-bot` directly without installing Bun. The default build targets the current platform.

Named platform builds are also available:

```bash
bun run build:darwin-arm64
bun run build:darwin-x64
bun run build:linux-arm64
bun run build:linux-x64
bun run build:windows-x64
```

The `lark-doc` command still requires `lark-cli` to be installed and authenticated on the user's machine, because the binary shells out to:

```bash
lark-cli docs +fetch --doc "<doc>" --format pretty
```

`news-bot lark-doc` also accepts these `lark-cli` flags and passes them through to `docs +fetch`: `--params`, `--data`, `--as`, `--format`, `--page-all`, `--page-size`, `--page-limit`, `--page-delay`, `-o`/`--output`, `--jq`, `-q`, `--dry-run`, and `--profile`. If `--format` is omitted, `news-bot` keeps using `pretty` so the fetched content is Markdown.

## Release

Releases are published by GitHub Actions when a version tag is pushed:

```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin main
git push origin v0.1.0
```

The release workflow builds these assets and uploads them to GitHub Releases:

```text
news-bot-darwin-arm64
news-bot-darwin-x64
news-bot-linux-arm64
news-bot-linux-x64
news-bot-windows-x64.exe
checksums.txt
install.sh
```

## Usage

```bash
dist/news-bot lark-doc --doc "https://xxx.feishu.cn/docx/..." --out ./docs
```

Pass through `lark-cli` flags when needed:

```bash
dist/news-bot lark-doc --doc "https://xxx.feishu.cn/docx/..." --out ./docs --as user --profile work
```

Download document media and rewrite references to local files:

```bash
dist/news-bot lark-doc --doc "https://xxx.feishu.cn/docx/..." --out ./docs --download-media
dist/news-bot lark-doc --doc "https://xxx.feishu.cn/docx/..." --out ./docs --download-media --media-out ./docs/assets
```

When media downloading is enabled, the command rewrites supported Markdown links and Lark native media tags to local relative paths. Local filenames include inferred media extensions, such as `.png` for images and `.mp4` for videos. Lark `<image />` and `<file />` tags receive a local `src` attribute while preserving existing attributes. Video `<file />` tags are rewritten as `<video />` tags; non-video file tags remain `<file />` tags. If a tag already has `src`, it is replaced with the local path.

Or with environment variables:

```bash
NEWS_BOT_LARK_DOC="https://xxx.feishu.cn/docx/..." \
NEWS_BOT_LARK_DOC_OUT="./docs" \
dist/news-bot lark-doc
```

Media options can also be configured with environment variables:

```bash
NEWS_BOT_LARK_DOC_DOWNLOAD_MEDIA=true \
NEWS_BOT_LARK_DOC_MEDIA_OUT="./docs/assets" \
dist/news-bot lark-doc
```
