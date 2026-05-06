import { pinyin } from "pinyin-pro";

const CHINESE_RE = /[\u3400-\u9fff]/;

export function buildMarkdownFilename(title: string | undefined, now = new Date()): string {
  const base = title ? normalizeTitle(title) : "";
  const safeBase = base || fallbackBase(now);
  return `${safeBase}.md`;
}

function normalizeTitle(title: string): string {
  const romanized = romanizeChineseOnly(title);

  return romanized
    .toLowerCase()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/[-_.]{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^\.+|\.+$/g, "");
}

function romanizeChineseOnly(title: string): string {
  let result = "";
  let chineseBuffer = "";

  for (const char of title) {
    if (CHINESE_RE.test(char)) {
      chineseBuffer += char;
      continue;
    }

    result += flushChineseBuffer(chineseBuffer);
    chineseBuffer = "";
    result += char;
  }

  result += flushChineseBuffer(chineseBuffer);
  return result;
}

function flushChineseBuffer(value: string): string {
  if (!value) return "";
  return ` ${pinyin(value, { toneType: "none", type: "array" }).join(" ")} `;
}

function fallbackBase(now: Date): string {
  const iso = now.toISOString();
  const date = iso.slice(0, 10).replaceAll("-", "");
  const time = iso.slice(11, 19).replaceAll(":", "");
  return `lark-doc-${date}-${time}`;
}
