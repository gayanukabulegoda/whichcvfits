import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3107";
const url = new URL(base);
assert(
  ["127.0.0.1", "localhost"].includes(url.hostname) &&
    ["3107", "3108"].includes(url.port),
  "Use the isolated local QA server with mocked providers.",
);
await mkdir("artifacts/redesign", { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const report = [];
async function api(path, data) {
  const response = await page.request.post(base + path, {
    headers: { Origin: base },
    data,
  });
  assert(response.ok(), `${path}: ${response.status()}`);
  return response.json();
}
async function capture(name, width) {
  if (name === "home" && width === 1440) {
    const labels = await new AxeBuilder({ page })
      .withRules(["label-content-name-mismatch"])
      .analyze();
    assert.equal(
      labels.violations.length,
      0,
      "Visible desktop navigation labels must match accessible names",
    );
  }
  const dialog = page.locator("dialog[open]");
  const modal = (await dialog.count()) > 0;
  if (modal) {
    await dialog
      .locator('[role="status"]')
      .filter({ hasText: /^Loading/ })
      .waitFor({ state: "hidden" });
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .map((animation) => animation.finished.catch(() => {})),
      );
    });
  }
  await page.screenshot({
    path: `artifacts/redesign/${name}-${width}.png`,
    fullPage: !modal,
  });
  const dimensions = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert(
    dimensions.scroll <= dimensions.width + 1,
    name + " overflows at " + width,
  );
  if (modal) {
    const state = await dialog.evaluate((el) => {
      const bounds = el.getBoundingClientRect(),
        close = el
          .querySelector('button[aria-label^="Close "]')
          .getBoundingClientRect();
      const body = el.querySelector(".dialog-body");
      return {
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom,
        height: innerHeight,
        width: innerWidth,
        closeTop: close.top,
        closeBottom: close.bottom,
        bodyWidth: body.clientWidth,
        bodyScroll: body.scrollWidth,
      };
    });
    assert(
      state.left >= -1 &&
        state.right <= state.width + 1 &&
        state.top >= -1 &&
        state.bottom <= state.height + 1,
      name + " dialog outside viewport: " + JSON.stringify(state),
    );
    assert(
      state.closeTop >= 0 && state.closeBottom <= state.height,
      name + " close control obscured",
    );
    assert(
      state.bodyScroll <= state.bodyWidth + 1,
      name + " dialog content overflows",
    );
    if (name === "dialog-compare-three" && width >= 768) {
      const rows = await dialog
        .locator(".comparison-grid > article")
        .evaluateAll((cards) =>
          cards.map((card) => card.children[2].getBoundingClientRect().top),
        );
      assert(
        Math.max(...rows) - Math.min(...rows) <= 1,
        "Comparison scoring rows must align even when names wrap",
      );
    }
  }
  report.push({ name, viewport: width, ...dimensions });
}
async function close() {
  await page.keyboard.press("Escape");
  await page.locator("dialog[open]").waitFor({ state: "hidden" });
}
try {
  await api("/api/auth", {
    action: "signup",
    name: "Design Review",
    email: `design.${Date.now()}@example.com`,
    password: "Isolated design QA passphrase!",
  });
  await api("/api/keys", {
    provider: "google",
    apiKey: "AIza" + "q".repeat(36),
    preferredModel: "gemini-3.8-flash",
  });
  const run = await api("/api/evaluate", {
    requestId: crypto.randomUUID(),
    jobTitle: "Full-stack engineer",
    requirementText:
      "Build production TypeScript and Python applications with clear technical communication.",
    provider: "google",
    modelId: "gemini-3.8-flash",
    effort: "medium",
    weights: { skills: 40, experience: 30, impact: 20, education: 10 },
    dealbreakers: ["TypeScript"],
    minPassScore: 70,
    cvs: ["Amelia Chen", "Ravi Fernando", "Sophia Williams"].map((name, i) => ({
      id: "design-" + i,
      fileName: name + ".txt",
      rawText:
        name +
        "\nSenior Full-Stack Engineer\nBuilt production TypeScript and Python applications for seven years. Led delivery and collaborated with product teams.",
    })),
  });
  const job = run.job.id;
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "",
      "signup",
      "onboarding",
      "settings",
      "how-it-works",
      "privacy",
      "sample",
    ]) {
      await page.goto(base + "/" + route, { waitUntil: "networkidle" });
      await capture(route || "home", width);
    }
    await page.goto(base + "/dashboard?job=" + job, {
      waitUntil: "networkidle",
    });
    await page
      .getByRole("button", { name: "View evidence", exact: true })
      .first()
      .waitFor();
    assert.equal(
      await page.getByRole("tab", { name: "1. Job", exact: true }).isVisible(),
      width < 768,
      "Mobile navigation visibility",
    );
    await capture("studio-results", width);
    await page
      .getByRole("button", { name: "View evidence", exact: true })
      .first()
      .click();
    await capture("dialog-evidence", width);
    await close();
    const compare = page.getByRole("checkbox", {
      name: "Compare",
      exact: true,
    });
    for (let i = 0; i < 3; i++) await compare.nth(i).check();
    await page
      .getByRole("button", { name: "Compare (3/3)", exact: true })
      .click();
    await capture("dialog-compare-three", width);
    await close();
    if (width < 768)
      await page.getByRole("tab", { name: "2. CVs (0)", exact: true }).click();
    await page.getByRole("button", { name: "Paste text", exact: true }).click();
    await capture("dialog-paste", width);
    await close();
    await page.goto(base + "/settings", { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Replace key", exact: true })
      .click();
    await capture("dialog-key", width);
    await close();
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await capture("dialog-remove", width);
    await close();
    await page
      .getByRole("button", { name: /Delete Full-stack engineer/ })
      .click();
    await capture("dialog-delete-run", width);
    await close();
  }
  await page.setViewportSize({ width: 390, height: 450 });
  await page.goto(base + "/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "2. CVs (0)", exact: true }).click();
  await page.getByRole("button", { name: "Paste text", exact: true }).click();
  await page.getByLabel("Complete CV text").focus();
  await capture("short-viewport-paste", 390);
  await close();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto(base + "/dashboard?job=" + job, { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "View evidence", exact: true })
    .first()
    .click();
  await capture("landscape-evidence", 844);
  await close();
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
    "auto",
  );
  await writeFile(
    "artifacts/redesign/visual-checks.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    `PASS: ${report.length} visual/reflow captures, mobile navigation visibility, three-way comparison, all dialog boundaries and close controls, short viewport, landscape, and reduced motion.`,
  );
} finally {
  await browser.close();
}
