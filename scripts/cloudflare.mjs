import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { publicWorkerEnvironment } from "./cloudflare-env.mjs";
const action = process.argv[2];
if (!["build", "preview"].includes(action))
  throw new Error(
    "Use build or preview. Deployment is intentionally excluded.",
  );
const envModule = ".open-next/cloudflare/next-env.mjs";
function sanitizeEnvironment() {
  writeFileSync(
    envModule,
    publicWorkerEnvironment(readFileSync(envModule, "utf8")),
  );
}
if (action === "preview") sanitizeEnvironment();
const result = spawnSync(
  "npx",
  ["--no-install", "opennextjs-cloudflare", action],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      WHICHCVFITS_TARGET: "cloudflare",
      WRANGLER_SEND_METRICS: "false",
    },
  },
);
if (result.status === 0 && action === "build") sanitizeEnvironment();
process.exit(result.status ?? 1);
