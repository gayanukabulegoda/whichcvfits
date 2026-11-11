import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3107";
const url = new URL(base);
assert(
  ["localhost", "127.0.0.1"].includes(url.hostname) &&
    ["3107", "3108"].includes(url.port),
  "Use the isolated local QA server.",
);
await mkdir("artifacts/polish", { recursive: true });
// Render the actual shared component, including its small/medium/large variants.
const fixturePath = path.resolve("artifacts/polish/gauge-component.mjs");
const source = await readFile("src/components/NeumorphicGauge.tsx", "utf8");
await writeFile(
  fixturePath,
  ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
);
const Gauge = (await import(pathToFileURL(fixturePath).href)).default;
const fixtures = [0, 9, 94, 100]
  .flatMap((score) =>
    ["sm", "md", "lg"].map(
      (size) =>
        `<article class="nm-flat" style="padding:16px;display:grid;place-items:center;gap:12px"><small>${size} · ${score}/100</small>${renderToStaticMarkup(createElement(Gauge, { score, size }))}</article>`,
    ),
  )
  .join("");
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const reports = [];
try {
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate((html) => {
      const main = document.querySelector("main");
      main.className = "container section";
      main.innerHTML = `<h1 style="font-size:24px;margin-bottom:24px">Score spacing — all sizes</h1><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;max-width:900px">${html}</div>`;
    }, fixtures);
    const gauges = await page.locator(".score-gauge").evaluateAll((elements) =>
      elements.map((el) => {
        const svg = el.querySelector("svg"),
          circle = svg.querySelector("circle"),
          bounds = svg.getBoundingClientRect();
        const center = {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2,
        };
        const innerRadius =
          ((Number(circle.getAttribute("r")) -
            Number(circle.getAttribute("stroke-width")) / 2) *
            bounds.width) /
          100;
        const distances = [
          ...el.querySelector(".score-gauge-label").children,
        ].flatMap((label) => {
          const r = label.getBoundingClientRect();
          return [
            [r.left, r.top],
            [r.right, r.top],
            [r.left, r.bottom],
            [r.right, r.bottom],
          ].map(([x, y]) => Math.hypot(x - center.x, y - center.y));
        });
        return {
          size: el.dataset.size,
          label: el.getAttribute("aria-label"),
          clearance: innerRadius - Math.max(...distances),
        };
      }),
    );
    for (const gauge of gauges)
      assert(gauge.clearance >= 4, JSON.stringify({ width, ...gauge }));
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await page.screenshot({
      path: `artifacts/polish/gauges-${width}.png`,
      fullPage: true,
    });
    reports.push({ width, gauges });
  }
  await writeFile(
    "artifacts/polish/gauge-clearance.json",
    JSON.stringify(reports, null, 2),
  );
  console.log(
    `PASS: ${reports.flatMap((r) => r.gauges).length} rendered gauge checks; at least ${Math.min(...reports.flatMap((r) => r.gauges.map((g) => g.clearance))).toFixed(2)}px between every label bounding box and the inner curve, including 100/100.`,
  );
} finally {
  await browser.close();
}
