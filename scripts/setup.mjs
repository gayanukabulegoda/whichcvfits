import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import "./copy-pdf-assets.mjs";
if (!existsSync(".env.local"))
  writeFileSync(
    ".env.local",
    "WHICHCVFITS_JWT_SECRET=" +
      randomBytes(32).toString("hex") +
      "\nWHICHCVFITS_ENCRYPTION_SECRET=" +
      randomBytes(32).toString("hex") +
      "\n",
    { mode: 0o600 },
  );
if (!existsSync(".dev.vars"))
  writeFileSync(".dev.vars", readFileSync(".env.local"), { mode: 0o600 });
console.log(
  "Local secrets and the self-hosted PDF worker are ready. Existing secrets were preserved.",
);
