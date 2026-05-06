#!/usr/bin/env bash
set -euo pipefail

repo="${NEWS_BOT_REPO:-adamwoohhh/news-bot}"
version="${NEWS_BOT_VERSION:-latest}"
install_dir="${NEWS_BOT_INSTALL_DIR:-$HOME/.local/bin}"
bin_name="news-bot"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

detect_platform() {
  local os arch platform cpu

  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m | tr '[:upper:]' '[:lower:]')"

  case "$os" in
    darwin) platform="darwin" ;;
    linux) platform="linux" ;;
    *)
      echo "Unsupported OS: $os" >&2
      exit 1
      ;;
  esac

  case "$arch" in
    arm64|aarch64) cpu="arm64" ;;
    x86_64|amd64) cpu="x64" ;;
    *)
      echo "Unsupported architecture: $arch" >&2
      exit 1
      ;;
  esac

  echo "${platform}-${cpu}"
}

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    echo "Missing required command: sha256sum or shasum" >&2
    exit 1
  fi
}

need_cmd curl
need_cmd awk
need_cmd grep
need_cmd mktemp
need_cmd uname

target="$(detect_platform)"
asset="${bin_name}-${target}"

if [ "$version" = "latest" ]; then
  base_url="https://github.com/${repo}/releases/latest/download"
else
  base_url="https://github.com/${repo}/releases/download/${version}"
fi
base_url="${NEWS_BOT_BASE_URL:-$base_url}"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

echo "Downloading ${asset} from ${repo} ${version}..."
curl -fsSL "${base_url}/${asset}" -o "$tmpdir/$bin_name"

echo "Verifying checksum..."
curl -fsSL "${base_url}/checksums.txt" -o "$tmpdir/checksums.txt"
expected="$(awk -v asset="$asset" '$2 == asset {print $1}' "$tmpdir/checksums.txt")"
actual="$(sha256_file "$tmpdir/$bin_name")"

if [ -z "$expected" ]; then
  echo "Checksum for ${asset} was not found in checksums.txt" >&2
  exit 1
fi

if [ "$expected" != "$actual" ]; then
  echo "Checksum verification failed for ${asset}" >&2
  exit 1
fi

mkdir -p "$install_dir"
chmod +x "$tmpdir/$bin_name"
mv "$tmpdir/$bin_name" "$install_dir/$bin_name"

echo "Installed ${bin_name} to ${install_dir}/${bin_name}"

case ":$PATH:" in
  *":$install_dir:"*) ;;
  *)
    echo "Add this directory to PATH before running ${bin_name}:"
    echo "  export PATH=\"${install_dir}:\$PATH\""
    ;;
esac

if ! command -v lark-cli >/dev/null 2>&1; then
  echo "Warning: lark-cli is required for 'news-bot lark-doc'. Install and authenticate lark-cli before use."
fi

"$install_dir/$bin_name" --version
