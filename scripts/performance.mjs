import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3107";
await mkdir("artifacts/qa", { recursive: true });
const summaries = [];
for (const [profile, path] of [
  ["mobile", "/"],
  ["desktop", "/"],
  ["mobile", "/how-it-works"],
  ["mobile", "/privacy"],
]) {
  const chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
  });
  try {
    const desktop = profile === "desktop";
    const run = await lighthouse(base + path, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      ...(desktop
        ? {
            formFactor: "desktop",
            screenEmulation: {
              mobile: false,
              width: 1440,
              height: 900,
              deviceScaleFactor: 1,
              disabled: false,
            },
            throttling: {
              rttMs: 40,
              throughputKbps: 10240,
              cpuSlowdownMultiplier: 1,
            },
          }
        : {}),
    });
    const name = (path === "/" ? "home" : path.slice(1)) + "-" + profile;
    await writeFile("artifacts/qa/lighthouse-" + name + ".json", run.report);
    const lhr = run.lhr;
    const summary = {
      page: path,
      profile,
      scores: Object.fromEntries(
        Object.entries(lhr.categories).map(([k, v]) => [
          k,
          Math.round(v.score * 100),
        ]),
      ),
      metrics: Object.fromEntries(
        [
          "first-contentful-paint",
          "largest-contentful-paint",
          "total-blocking-time",
          "cumulative-layout-shift",
          "speed-index",
        ].map((id) => [id, lhr.audits[id].numericValue]),
      ),
    };
    summaries.push(summary);
    console.log(JSON.stringify(summary));
  } finally {
    await chrome.kill();
  }
}
await writeFile(
  "artifacts/qa/performance-summary.json",
  JSON.stringify(summaries, null, 2),
);
