import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { MediaDownloadTarget } from "./media.ts";

export async function fetchLarkDocMarkdown(doc: string): Promise<string> {
  const proc = Bun.spawn(["lark-cli", "docs", "+fetch", "--doc", doc, "--format", "pretty"], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    const detail = stderr.trim() || stdout.trim() || `exit code ${exitCode}`;
    throw new Error(`lark-cli docs +fetch failed: ${detail}`);
  }

  const markdown = stdout.trim();
  if (!markdown) {
    throw new Error("Fetched Markdown is empty.");
  }

  return markdown;
}

export async function downloadLarkDocMedia(media: MediaDownloadTarget): Promise<void> {
  await mkdir(dirname(media.output), { recursive: true });

  const proc = Bun.spawn(
    ["lark-cli", "docs", "+media-download", "--token", media.token, "--output", media.output],
    {
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    const detail = stderr.trim() || stdout.trim() || `exit code ${exitCode}`;
    throw new Error(`lark-cli docs +media-download failed for ${media.token}: ${detail}`);
  }
}
