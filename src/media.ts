export type LarkMediaReference = {
  token: string;
  originalUrl?: string;
};

const markdownUrlPattern = /!?\[[^\]]*\]\(([^)\s]+)\)/g;
const larkMediaTagPattern = /<(image|file)\b[^>]*>/g;
const attributePattern = /([a-zA-Z_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const videoExtensionPattern = /\.(?:mp4|mov|m4v|webm|avi|mkv)(?:[?#].*)?$/i;

export function findLarkMediaReferences(markdown: string): LarkMediaReference[] {
  const references: LarkMediaReference[] = [];
  const seen = new Set<string>();

  for (const match of markdown.matchAll(markdownUrlPattern)) {
    const originalUrl = match[1];
    const token = extractMediaToken(originalUrl);
    if (!token || seen.has(token)) {
      continue;
    }

    seen.add(token);
    references.push({ token, originalUrl });
  }

  for (const match of markdown.matchAll(larkMediaTagPattern)) {
    const token = parseAttributes(match[0]).get("token")?.trim();
    if (!token || seen.has(token)) {
      continue;
    }

    seen.add(token);
    references.push({ token });
  }

  return references;
}

export function rewriteLarkMediaReferences(
  markdown: string,
  replacements: Map<string, string>,
): string {
  return markdown
    .replace(markdownUrlPattern, (fullMatch, originalUrl: string) => {
      const token = extractMediaToken(originalUrl);
      const replacement = token ? replacements.get(token) : undefined;
      return replacement ? fullMatch.replace(originalUrl, replacement) : fullMatch;
    })
    .replace(larkMediaTagPattern, (fullMatch, tagName: string) =>
      rewriteLarkMediaTag(fullMatch, tagName, replacements),
    );
}

function extractMediaToken(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const queryToken = parsed.searchParams.get("file_token") ?? parsed.searchParams.get("token");
    if (queryToken) {
      return queryToken;
    }

    const mediaMatch = parsed.pathname.match(/\/media\/([^/?#]+)/);
    return mediaMatch?.[1];
  } catch {
    return undefined;
  }
}

function parseAttributes(tag: string): Map<string, string> {
  const attrs = new Map<string, string>();

  for (const match of tag.matchAll(attributePattern)) {
    attrs.set(match[1], match[2] ?? match[3] ?? "");
  }

  return attrs;
}

function rewriteLarkMediaTag(
  tag: string,
  tagName: string,
  replacements: Map<string, string>,
): string {
  const attrs = parseAttributes(tag);
  const token = attrs.get("token")?.trim();
  const replacement = token ? replacements.get(token) : undefined;
  if (!replacement) {
    return tag;
  }

  const rewrittenTagName = tagName === "file" && isVideoFileTag(attrs) ? "video" : tagName;
  return replaceTagName(upsertAttribute(tag, "src", replacement), rewrittenTagName);
}

function isVideoFileTag(attrs: Map<string, string>): boolean {
  const name = attrs.get("name");
  const src = attrs.get("src");
  return Boolean(
    (name && videoExtensionPattern.test(name)) ||
      (src && videoExtensionPattern.test(src)),
  );
}

function replaceTagName(tag: string, tagName: string): string {
  return tag.replace(/^<\s*(?:image|file)\b/, `<${tagName}`);
}

function upsertAttribute(tag: string, name: string, value: string): string {
  const escapedValue = escapeAttributeValue(value);
  const attribute = `${name}="${escapedValue}"`;
  const existingAttributePattern = new RegExp(`\\s+${name}\\s*=\\s*(?:"[^"]*"|'[^']*')`);

  if (existingAttributePattern.test(tag)) {
    return tag.replace(existingAttributePattern, ` ${attribute}`);
  }

  return tag.replace(/(\s*\/?>)$/, ` ${attribute}$1`);
}

function escapeAttributeValue(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}
