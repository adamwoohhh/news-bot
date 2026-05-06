type LarkCliProcess = {
  stdout: ReadableStream<Uint8Array> | null;
  stderr: ReadableStream<Uint8Array> | null;
  exited: Promise<number>;
};

type LarkCliSpawn = (
  args: string[],
  options: { stdout: "pipe"; stderr: "pipe" },
) => LarkCliProcess;

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
