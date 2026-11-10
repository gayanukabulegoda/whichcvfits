import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { publicWorkerEnvironment } from "./cloudflare-env.mjs";
import {
  deploymentOrigin,
  requireDeploymentDatabase,
} from "./cloudflare-deployment.mjs";
const action = process.argv[2];
if (!["build", "preview", "deploy"].includes(action))
  throw new Error("Use build, preview, or deploy.");
const envModule = ".open-next/cloudflare/next-env.mjs";
function sanitizeEnvironment() {
  writeFileSync(
    envModule,
    publicWorkerEnvironment(readFileSync(envModule, "utf8")),
  );
}
const environment = {
  ...process.env,
  WHICHCVFITS_TARGET: "cloudflare",
  WRANGLER_SEND_METRICS: "false",
  WRANGLER_LOG_PATH: ".wrangler/logs",
};
function run(command) {
  return spawnSync("npx", ["--no-install", "opennextjs-cloudflare", command], {
    stdio: "inherit",
    env: environment,
  });
}
if (action === "deploy") {
  environment.NEXT_PUBLIC_SITE_URL = deploymentOrigin(
    process.env.NEXT_PUBLIC_SITE_URL,
  );
  requireDeploymentDatabase(readFileSync("wrangler.jsonc", "utf8"));
  const build = run("build");
  if (build.status !== 0) process.exit(build.status ?? 1);
  sanitizeEnvironment();
} else if (action === "preview") sanitizeEnvironment();
const result = run(action);
if (result.status === 0 && action === "build") sanitizeEnvironment();
process.exit(result.status ?? 1);
