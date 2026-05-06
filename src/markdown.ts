export function extractFirstH1(markdown: string): string | undefined {
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\s{0,3}#(?!#)\s+(.+?)\s*$/);
    if (!match) continue;

    const title = match[1]?.trim();
    if (title) return title;
  }

  return undefined;
}
