#!/usr/bin/env bun

import { Command } from "commander";
import packageJson from "../package.json";
import { runLarkDoc } from "./commands/lark-doc.ts";

const program = new Command();

program
  .name("news-bot")
  .description("Utilities for fetching and processing news-related content.")
  .version(packageJson.version);

program
  .command("lark-doc")
  .description("Fetch a Lark document as Markdown and write it to a local file.")
  .option("--doc <doc>", "Lark document URL or token. Falls back to NEWS_BOT_LARK_DOC.")
  .option(
    "--out <dir>",
    "Output directory. Falls back to NEWS_BOT_LARK_DOC_OUT, then current directory.",
  )
  .option(
    "--download-media",
    "Download document media and rewrite Markdown links. Falls back to NEWS_BOT_LARK_DOC_DOWNLOAD_MEDIA.",
  )
  .option(
    "--media-out <dir>",
    "Media output directory. Falls back to NEWS_BOT_LARK_DOC_MEDIA_OUT, then <out>/media.",
  )
  .option("--params <json>", "Pass URL/query parameters JSON through to lark-cli.")
  .option("--data <json>", "Pass request body JSON through to lark-cli.")
  .option("--as <type>", "Pass identity type through to lark-cli: user | bot | auto.")
  .option("--format <fmt>", "Pass output format through to lark-cli.")
  .option("--page-all", "Pass automatic pagination through to lark-cli.")
  .option("--page-size <N>", "Pass page size through to lark-cli.")
  .option("--page-limit <N>", "Pass max page count through to lark-cli.")
  .option("--page-delay <MS>", "Pass page delay through to lark-cli.")
  .option("-o, --output <path>", "Pass binary output file path through to lark-cli.")
  .option("--jq <expr>", "Pass jq filter expression through to lark-cli.")
  .option("-q <expr>", "Shorthand for --jq.")
  .option("--dry-run", "Pass dry-run mode through to lark-cli.")
  .option("--profile <profile>", "Pass lark-cli profile through to lark-cli.")
  .action(async (options: {
    doc?: string;
    out?: string;
    downloadMedia?: boolean;
    mediaOut?: string;
    params?: string;
    data?: string;
    as?: string;
    format?: string;
    pageAll?: boolean;
    pageSize?: string;
    pageLimit?: string;
    pageDelay?: string;
    output?: string;
    jq?: string;
    q?: string;
    dryRun?: boolean;
    profile?: string;
  }) => {
    try {
      await runLarkDoc({
        ...options,
        jq: options.jq ?? options.q,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exitCode = 1;
    }
  });

await program.parseAsync();
