import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
const temporary = mkdtempSync(path.join(tmpdir(), "whichcvfits-qa-"));
const dev = process.argv.includes("--dev");
const args = dev ? ["dev", "--webpack"] : ["start"];
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    ...args,
    "--hostname",
    "127.0.0.1",
    "--port",
    process.env.QA_PORT || "3107",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      WHICHCVFITS_DB_PATH: path.join(temporary, "qa.db"),
      WHICHCVFITS_PROVIDER_MOCK: "1",
      ...(dev ? { WHICHCVFITS_QA_DIST_DIR: ".next-qa" } : {}),
      NODE_OPTIONS: "--import ./scripts/mock-providers.mjs",
    },
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.kill(signal));
server.on("exit", (code) => {
  rmSync(temporary, { recursive: true, force: true });
  process.exit(code || 0);
});
