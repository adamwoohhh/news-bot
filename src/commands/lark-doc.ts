import { resolveLarkDocConfig, type LarkDocOptions } from "../config.ts";
import { buildMarkdownFilename } from "../filename.ts";
import { downloadLarkDocMedia, fetchLarkDocMarkdown } from "../lark.ts";
import { extractFirstH1 } from "../markdown.ts";
import { findLarkMediaReferences, rewriteLarkMediaReferences } from "../media.ts";
import { writeUniqueMarkdownFile } from "../writer.ts";
import { mkdir } from "node:fs/promises";
import { join, relative } from "node:path";

type RunDeps = {
  fetchMarkdown?: (doc: string) => Promise<string>;
  downloadMedia?: (token: string, outputPath: string) => Promise<void>;
  log?: (message: string) => void;
};

export async function runLarkDoc(
  options: LarkDocOptions,
  env: Record<string, string | undefined> = process.env,
  deps: RunDeps = {},
): Promise<string> {
  const config = resolveLarkDocConfig(options, env);
  const fetchMarkdown = deps.fetchMarkdown ?? fetchLarkDocMarkdown;
  const downloadMedia = deps.downloadMedia ?? downloadLarkDocMedia;
  const log = deps.log ?? console.log;

  let markdown = (await fetchMarkdown(config.doc)).trim();
  if (!markdown) {
    throw new Error("Fetched Markdown is empty.");
  }

  if (config.downloadMedia) {
    const references = findLarkMediaReferences(markdown);
    if (references.length > 0) {
      await mkdir(config.mediaOutDir, { recursive: true });

      const replacements = new Map<string, string>();
      for (const reference of references) {
        const outputPath = join(config.mediaOutDir, reference.token);
        await downloadMedia(reference.token, outputPath);
        replacements.set(reference.token, toMarkdownRelativePath(config.outDir, outputPath));
      }

      markdown = rewriteLarkMediaReferences(markdown, replacements);
    }
  }

  const title = extractFirstH1(markdown);
  const filename = buildMarkdownFilename(title);
  const outputPath = await writeUniqueMarkdownFile(config.outDir, filename, markdown);

  log(outputPath);
  return outputPath;
}

function toMarkdownRelativePath(fromDir: string, targetPath: string): string {
  const path = relative(fromDir, targetPath).replaceAll("\\", "/");
  return path.startsWith(".") ? path : `./${path}`;
}
