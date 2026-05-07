import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const scriptPath = join(import.meta.dir, "..", "scripts", "auto-version.sh");
const tmpRepos: string[] = [];

async function run(cmd: string[], cwd: string) {
  const process = Bun.spawn({
    cmd,
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);

  return { stdout, stderr, exitCode };
}

async function createRepo(version = "1.2.3") {
  const repo = await mkdtemp(join(tmpdir(), "news-bot-auto-version-"));
  tmpRepos.push(repo);

  await writeFile(
    join(repo, "package.json"),
    `${JSON.stringify({ name: "tmp-news-bot", version }, null, 2)}\n`,
  );
  await run(["git", "init"], repo);
  await run(["git", "config", "user.email", "test@example.com"], repo);
  await run(["git", "config", "user.name", "Test User"], repo);
  await run(["git", "add", "package.json"], repo);
  await run(["git", "commit", "-m", "chore: init"], repo);

  return repo;
}

afterEach(async () => {
  await Promise.all(
    tmpRepos.splice(0).map((repo) =>
      rm(repo, {
        force: true,
        recursive: true,
      }),
    ),
  );
});

describe("scripts/auto-version.sh", () => {
  test("bumps package patch version, commits package.json, and creates an annotated tag", async () => {
    const repo = await createRepo();

    const result = await run(["bash", scriptPath], repo);

    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);

    const packageJson = await Bun.file(join(repo, "package.json")).json();
    expect(packageJson.version).toBe("1.2.4");

    const commit = await run(["git", "log", "-1", "--pretty=%s"], repo);
    expect(commit.stdout.trim()).toBe("chore: auto version: 1.2.4");

    const status = await run(["git", "status", "--porcelain"], repo);
    expect(status.stdout).toBe("");

    const tag = await run(["git", "tag", "-n99", "v1.2.4"], repo);
    expect(tag.stdout.trim()).toBe("v1.2.4          auto tag: 1.2.4");
  });

  test("stops before changing files when the git working tree is dirty", async () => {
    const repo = await createRepo();
    await writeFile(join(repo, "README.md"), "local change\n");

    const result = await run(["bash", scriptPath], repo);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Git working tree is not clean");

    const packageJson = await Bun.file(join(repo, "package.json")).json();
    expect(packageJson.version).toBe("1.2.3");

    const commit = await run(["git", "log", "-1", "--pretty=%s"], repo);
    expect(commit.stdout.trim()).toBe("chore: init");
  });
});
