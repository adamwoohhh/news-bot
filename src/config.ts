export type LarkDocOptions = {
  doc?: string;
  out?: string;
};

export type LarkDocConfig = {
  doc: string;
  outDir: string;
};

export function resolveLarkDocConfig(
  options: LarkDocOptions,
  env: Record<string, string | undefined> = process.env,
): LarkDocConfig {
  const doc = firstNonEmpty(options.doc, env.NEWS_BOT_LARK_DOC);
  const outDir = firstNonEmpty(options.out, env.NEWS_BOT_LARK_DOC_OUT) ?? ".";

  if (!doc) {
    throw new Error(
      "Missing required document. Pass --doc <url-or-token> or set NEWS_BOT_LARK_DOC.",
    );
  }

  return { doc, outDir };
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value));
}
