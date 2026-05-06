import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join, parse } from "node:path";

export async function writeUniqueMarkdownFile(
  outDir: string,
  filename: string,
  markdown: string,
): Promise<string> {
  await mkdir(outDir, { recursive: true });

  const { name } = parse(filename);
  const ext = extname(filename) || ".md";
  let candidate = join(outDir, `${name}${ext}`);
  let suffix = 2;

  while (existsSync(candidate)) {
    candidate = join(outDir, `${name}-${suffix}${ext}`);
    suffix += 1;
  }

  await writeFile(candidate, markdown, "utf8");
  return candidate;
}
