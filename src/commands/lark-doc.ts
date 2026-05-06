import { resolveLarkDocConfig, type LarkDocOptions } from "../config.ts";
import { buildMarkdownFilename } from "../filename.ts";
import { fetchLarkDocMarkdown } from "../lark.ts";
import { extractFirstH1 } from "../markdown.ts";
import { writeUniqueMarkdownFile } from "../writer.ts";

type RunDeps = {
  fetchMarkdown?: (doc: string) => Promise<string>;
  log?: (message: string) => void;
};

export async function runLarkDoc(
  options: LarkDocOptions,
  env: Record<string, string | undefined> = process.env,
  deps: RunDeps = {},
): Promise<string> {
  const config = resolveLarkDocConfig(options, env);
  const fetchMarkdown = deps.fetchMarkdown ?? fetchLarkDocMarkdown;
  const log = deps.log ?? console.log;

  const markdown = (await fetchMarkdown(config.doc)).trim();
  if (!markdown) {
    throw new Error("Fetched Markdown is empty.");
  }

  const title = extractFirstH1(markdown);
  const filename = buildMarkdownFilename(title);
  const outputPath = await writeUniqueMarkdownFile(config.outDir, filename, markdown);

  log(outputPath);
  return outputPath;
}
