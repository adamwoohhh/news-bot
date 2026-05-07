# news-bot 中文说明

`news-bot` 是一个基于 Bun 的 CLI 项目，用于拉取飞书文档并保存为本地 Markdown 文件。

## 安装

普通用户可以直接从 GitHub Releases 安装 macOS 或 Linux 预编译二进制：

```bash
curl -fsSL https://github.com/adamwoohhh/news-bot/releases/latest/download/install.sh | bash
```

安装指定版本：

```bash
curl -fsSLO https://github.com/adamwoohhh/news-bot/releases/latest/download/install.sh
NEWS_BOT_VERSION=v0.1.0 bash install.sh
```

安装脚本默认写入：

```text
~/.local/bin/news-bot
```

如果要指定安装目录：

```bash
NEWS_BOT_INSTALL_DIR=/usr/local/bin bash install.sh
```

如果使用内部镜像或其他 release 托管地址：

```bash
NEWS_BOT_BASE_URL=https://example.com/news-bot/v0.1.0 bash install.sh
```

注意：`lark-doc` 命令依赖用户本机已经安装并登录 `lark-cli`。

## 使用

拉取一个飞书文档并写入指定目录：

```bash
news-bot lark-doc --doc "https://xxx.feishu.cn/docx/..." --out ./docs
```

下载文档中的多媒体文件，并把引用改写为本地相对路径：

```bash
news-bot lark-doc --doc "https://xxx.feishu.cn/docx/..." --out ./docs --download-media
news-bot lark-doc --doc "https://xxx.feishu.cn/docx/..." --out ./docs --download-media --media-out ./docs/assets
```

启用多媒体下载后，命令会改写支持的 Markdown 链接和飞书原生多媒体标签。`<image />` 和 `<file />` 标签会保留原有属性，并增加本地 `src` 属性；如果原标签已有 `src`，会替换为本地路径。视频类型的 `<file />` 标签会改写为 `<video />` 标签，非视频文件仍保留为 `<file />` 标签。

也可以用环境变量传入参数：

```bash
NEWS_BOT_LARK_DOC="https://xxx.feishu.cn/docx/..." \
NEWS_BOT_LARK_DOC_OUT="./docs" \
news-bot lark-doc
```

多媒体下载也可以通过环境变量配置：

```bash
NEWS_BOT_LARK_DOC_DOWNLOAD_MEDIA=true \
NEWS_BOT_LARK_DOC_MEDIA_OUT="./docs/assets" \
news-bot lark-doc
```

`news-bot` 会调用：

```bash
lark-cli docs +fetch --doc "<doc>" --format pretty
```

如果 `lark-cli` 没有安装、没有登录，或者当前账号没有文档权限，命令会失败。

## 本地构建

开发者需要先安装 Bun：

```bash
bun install
bun run build
```

默认构建会生成：

```text
dist/news-bot
```

也可以构建指定平台产物：

```bash
bun run build:darwin-arm64
bun run build:darwin-x64
bun run build:linux-arm64
bun run build:linux-x64
bun run build:windows-x64
```

## 发布

发布通过 GitHub Actions 自动完成。推送版本 tag 后，workflow 会运行测试、构建多平台二进制、生成 checksum，并把产物上传到 GitHub Release。

```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin main
git push origin v0.1.0
```

每个 release 包含：

```text
news-bot-darwin-arm64
news-bot-darwin-x64
news-bot-linux-arm64
news-bot-linux-x64
news-bot-windows-x64.exe
checksums.txt
install.sh
```

用户默认安装 latest release；生产或固定环境建议显式设置 `NEWS_BOT_VERSION`。
