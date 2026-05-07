import { describe, expect, test } from "bun:test";
import packageJson from "../package.json";

describe("news-bot CLI", () => {
  test("prints the package version with -V", async () => {
    const process = Bun.spawn({
      cmd: ["bun", "src/index.ts", "-V"],
      stdout: "pipe",
      stderr: "pipe",
    });

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(process.stdout).text(),
      new Response(process.stderr).text(),
      process.exited,
    ]);

    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe(packageJson.version);
  });
});
