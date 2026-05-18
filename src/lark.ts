import type { LarkCliPassthroughOptions } from "./config.ts";

type LarkCliProcess = {
  stdout: ReadableStream<Uint8Array> | null;
  stderr: ReadableStream<Uint8Array> | null;
  exited: Promise<number>;
};

type LarkCliSpawn = (
  args: string[],
  options: { stdout: "pipe"; stderr: "pipe" },
) => LarkCliProcess;

export async function fetchLarkDocMarkdown(
  doc: string,
  options: LarkCliPassthroughOptions = {},
  spawn: LarkCliSpawn = Bun.spawn as LarkCliSpawn,
): Promise<string> {
  const proc = spawn(buildLarkDocFetchArgs(doc, options), {
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

function buildLarkDocFetchArgs(doc: string, options: LarkCliPassthroughOptions): string[] {
  const args = ["lark-cli", "docs", "+fetch", "--doc", doc];

  appendFlag(args, "--params", options.params);
  appendFlag(args, "--data", options.data);
  appendFlag(args, "--as", options.as);
  appendFlag(args, "--format", options.format ?? "pretty");
  if (options.pageAll) {
    args.push("--page-all");
  }
  appendFlag(args, "--page-size", options.pageSize);
  appendFlag(args, "--page-limit", options.pageLimit);
  appendFlag(args, "--page-delay", options.pageDelay);
  appendFlag(args, "--output", options.output);
  appendFlag(args, "--jq", options.jq);
  if (options.dryRun) {
    args.push("--dry-run");
  }
  appendFlag(args, "--profile", options.profile);

  return args;
}

function appendFlag(args: string[], flag: string, value: string | undefined): void {
  if (value) {
    args.push(flag, value);
  }
}

export async function downloadLarkDocMedia(
  token: string,
  outputPath: string,
  spawn: LarkCliSpawn = Bun.spawn as LarkCliSpawn,
): Promise<void> {
  const proc = spawn([
    "lark-cli",
    "docs",
    "+media-download",
    "--token",
    token,
    "--type",
    "media",
    "--output",
    outputPath,
  ], {
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
    throw new Error(`lark-cli docs +media-download failed: ${detail}`);
  }
}
