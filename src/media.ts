export type LarkMediaReference = {
  token: string;
  originalUrl?: string;
};

const markdownUrlPattern = /!?\[[^\]]*\]\(([^)\s]+)\)/g;
const larkMediaTagPattern = /<(?:image|file)\b[^>]*>/g;
const attributePattern = /([a-zA-Z_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

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
  return markdown.replace(markdownUrlPattern, (fullMatch, originalUrl: string) => {
    const token = extractMediaToken(originalUrl);
    const replacement = token ? replacements.get(token) : undefined;
    return replacement ? fullMatch.replace(originalUrl, replacement) : fullMatch;
  });
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
