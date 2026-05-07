#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not inside a git working tree" >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Git working tree is not clean. Commit or stash changes before auto versioning." >&2
  exit 1
fi

if [ ! -f package.json ]; then
  echo "package.json was not found in the current directory" >&2
  exit 1
fi

package_version="$(
  bun -e '
    const fs = require("node:fs");
    const path = "package.json";
    const packageJson = JSON.parse(fs.readFileSync(path, "utf8"));
    const version = String(packageJson.version ?? "");
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);

    if (!match || match[4] !== "") {
      console.error(`Unsupported package.json version: ${version}`);
      process.exit(1);
    }

    packageJson.version = `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
    fs.writeFileSync(path, `${JSON.stringify(packageJson, null, 2)}\n`);
    console.log(packageJson.version);
  '
)"

git add package.json
git commit -m "chore: auto version: ${package_version}"
git tag -a "v${package_version}" -m "auto tag: ${package_version}"

echo "Created version ${package_version}"
