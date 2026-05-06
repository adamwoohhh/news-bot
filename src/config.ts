export type LarkDocOptions = {
  doc?: string;
  out?: string;
  downloadMedia?: boolean;
  mediaDir?: string;
};

export type LarkDocConfig = {
  doc: string;
  outDir: string;
  downloadMedia: boolean;
  mediaDir: string;
};

export function resolveLarkDocConfig(
  options: LarkDocOptions,
  env: Record<string, string | undefined> = process.env,
): LarkDocConfig {
  const doc = firstNonEmpty(options.doc, env.NEWS_BOT_LARK_DOC);
  const outDir = firstNonEmpty(options.out, env.NEWS_BOT_LARK_DOC_OUT) ?? ".";
  const downloadMedia =
    options.downloadMedia ?? parseBoolean(env.NEWS_BOT_LARK_DOC_DOWNLOAD_MEDIA) ?? false;
  const mediaDir = firstNonEmpty(options.mediaDir, env.NEWS_BOT_LARK_DOC_MEDIA_DIR) ?? "media";

  if (!doc) {
    throw new Error(
      "Missing required document. Pass --doc <url-or-token> or set NEWS_BOT_LARK_DOC.",
    );
  }

  return { doc, outDir, downloadMedia, mediaDir };
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value));
}

function parseBoolean(value: string | undefined): boolean | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return undefined;
}
