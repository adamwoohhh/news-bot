import { join } from "node:path";

export type LarkDocOptions = {
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
  dryRun?: boolean;
  profile?: string;
};

export type LarkDocConfig = {
  doc: string;
  outDir: string;
  downloadMedia: boolean;
  mediaOutDir: string;
  larkCliOptions: LarkCliPassthroughOptions;
};

export type LarkCliPassthroughOptions = {
  params?: string;
  data?: string;
  as?: string;
  format?: string;
  pageAll?: true;
  pageSize?: string;
  pageLimit?: string;
  pageDelay?: string;
  output?: string;
  jq?: string;
  dryRun?: true;
  profile?: string;
};

export function resolveLarkDocConfig(
  options: LarkDocOptions,
  env: Record<string, string | undefined> = process.env,
): LarkDocConfig {
  const doc = firstNonEmpty(options.doc, env.NEWS_BOT_LARK_DOC);
  const outDir = firstNonEmpty(options.out, env.NEWS_BOT_LARK_DOC_OUT) ?? ".";
  const downloadMedia =
    options.downloadMedia ?? parseBoolean(env.NEWS_BOT_LARK_DOC_DOWNLOAD_MEDIA) ?? false;
  const mediaOutDir = firstNonEmpty(options.mediaOut, env.NEWS_BOT_LARK_DOC_MEDIA_OUT) ?? join(outDir, "media");

  if (!doc) {
    throw new Error(
      "Missing required document. Pass --doc <url-or-token> or set NEWS_BOT_LARK_DOC.",
    );
  }

  return {
    doc,
    outDir,
    downloadMedia,
    mediaOutDir,
    larkCliOptions: resolveLarkCliPassthroughOptions(options),
  };
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value));
}

function resolveLarkCliPassthroughOptions(options: LarkDocOptions): LarkCliPassthroughOptions {
  const passthrough: LarkCliPassthroughOptions = {};

  assignString(passthrough, "params", options.params);
  assignString(passthrough, "data", options.data);
  assignString(passthrough, "as", options.as);
  assignString(passthrough, "format", options.format);
  if (options.pageAll) {
    passthrough.pageAll = true;
  }
  assignString(passthrough, "pageSize", options.pageSize);
  assignString(passthrough, "pageLimit", options.pageLimit);
  assignString(passthrough, "pageDelay", options.pageDelay);
  assignString(passthrough, "output", options.output);
  assignString(passthrough, "jq", options.jq);
  if (options.dryRun) {
    passthrough.dryRun = true;
  }
  assignString(passthrough, "profile", options.profile);

  return passthrough;
}

function assignString<K extends keyof LarkCliPassthroughOptions>(
  target: LarkCliPassthroughOptions,
  key: K,
  value: string | undefined,
): void {
  const resolved = firstNonEmpty(value);
  if (resolved) {
    target[key] = resolved as LarkCliPassthroughOptions[K];
  }
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}
