import { join } from "node:path";
import { buildSafeFilename } from "./filename.ts";

export type LarkDocMedia = {
  token: string;
  name?: string;
};

export type MediaDownloadTarget = {
  token: string;
  output: string;
};

const MEDIA_TAG_RE = /<(?:image|file)\b[^>]*>/gi;
const ATTR_RE = /([a-zA-Z_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

export function buildMediaDownloadTargets(
  markdown: string,
  mediaDir: string,
): MediaDownloadTarget[] {
  return extractLarkDocMedia(markdown).map((media) => ({
    token: media.token,
    output: join(mediaDir, media.name ? buildSafeFilename(media.name) || media.token : media.token),
  }));
}

export function extractLarkDocMedia(markdown: string): LarkDocMedia[] {
  const media: LarkDocMedia[] = [];
  const seen = new Set<string>();

  for (const match of markdown.matchAll(MEDIA_TAG_RE)) {
    const attrs = parseAttributes(match[0]);
    const token = attrs.get("token")?.trim();
    if (!token || seen.has(token)) continue;

    seen.add(token);
    const name = attrs.get("name")?.trim();
    media.push(name ? { token, name } : { token });
  }

  return media;
}

function parseAttributes(tag: string): Map<string, string> {
  const attrs = new Map<string, string>();

  for (const match of tag.matchAll(ATTR_RE)) {
    attrs.set(match[1], match[2] ?? match[3] ?? "");
  }

  return attrs;
}
