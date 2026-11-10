import { mkdirSync, copyFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
mkdirSync("public/workers", { recursive: true });
for (const filename of ["pdf.min.mjs", "pdf.worker.min.mjs"])
  copyFileSync(
    require.resolve("pdfjs-dist/build/" + filename),
    "public/workers/" + filename,
  );
