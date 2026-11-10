import { spawnSync } from "node:child_process";
import path from "node:path";
import { readFileSync } from "node:fs";
const accountId = readFileSync("wrangler.jsonc", "utf8").match(
  /"account_id"\s*:\s*"([0-9a-f]{32})"/i,
)?.[1];
if (!accountId)
  throw new Error(
    "Configure the owner account in wrangler.jsonc before deploying the gateway.",
  );
const result = spawnSync(
  path.resolve("node_modules/.bin/wrangler"),
  [
    "pages",
    "deploy",
    "public",
    "--project-name",
    "whichcvfits-domain",
    "--branch",
    "main",
    "--commit-dirty=true",
  ],
  {
    cwd: path.resolve("gateway"),
    stdio: "inherit",
    env: {
      ...process.env,
      CLOUDFLARE_ACCOUNT_ID: accountId,
      WRANGLER_LOG_PATH: path.resolve(".wrangler/logs"),
      WRANGLER_SEND_METRICS: "false",
    },
  },
);
process.exit(result.status ?? 1);
