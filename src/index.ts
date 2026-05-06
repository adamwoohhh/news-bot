#!/usr/bin/env bun

import { Command } from "commander";
import { runLarkDoc } from "./commands/lark-doc.ts";

const program = new Command();

program
  .name("news-bot")
  .description("Utilities for fetching and processing news-related content.")
  .version("0.1.0");

program
  .command("lark-doc")
  .description("Fetch a Lark document as Markdown and write it to a local file.")
  .option("--doc <doc>", "Lark document URL or token. Falls back to NEWS_BOT_LARK_DOC.")
  .option(
    "--out <dir>",
    "Output directory. Falls back to NEWS_BOT_LARK_DOC_OUT, then current directory.",
  )
  .action(async (options: { doc?: string; out?: string }) => {
    try {
      await runLarkDoc(options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exitCode = 1;
    }
  });

await program.parseAsync();
