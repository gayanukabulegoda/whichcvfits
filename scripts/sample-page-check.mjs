import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, webkit } from "playwright";
import AxeBuilder from "@axe-core/playwright";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3107";
const url = new URL(base);
assert(
  ["localhost", "127.0.0.1"].includes(url.hostname) &&
    ["3107", "3108"].includes(url.port),
  "Use the isolated QA server.",
);
await mkdir("artifacts/sample-page", { recursive: true });
const report = [];
for (const [engineName, engine] of [
  ["chromium", chromium],
  ["webkit", webkit],
]) {
  const browser = await engine.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const apiRequests = [],
    errors = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/"))
      apiRequests.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    for (const width of [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/", { waitUntil: "networkidle" });
      assert.equal(
        await page.locator(".sample-console").count(),
        0,
        "The landing page must not mount the simulator",
      );
      const cta = page
        .locator(".hero")
        .getByRole("link", { name: "Try the sample", exact: true });
      assert.equal(await cta.getAttribute("href"), "/sample");
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await cta.click();
      await page.waitForURL("**/sample");
      await page
        .getByRole("heading", {
          name: "See a shortlist take shape.",
          exact: true,
        })
        .waitFor();
      assert.equal(
        await page.locator(".sample-console .relief-art").count(),
        0,
      );
      assert.equal(await page.locator(".sample-candidate").count(), 3);
      for (const [name, score] of [
        ["Elena Rostova", 83],
        ["Marcus Vance", 45],
        ["Alex Rivera", 94],
      ]) {
        const choice = page
          .locator(".sample-candidate")
          .filter({ hasText: name });
        await choice.click();
        assert.equal(await choice.getAttribute("aria-pressed"), "true");
        assert.equal(
          await page.locator("#sample-candidate-heading").innerText(),
          name,
        );
        assert(
          (
            await page
              .locator(".sample-evidence [role=img]")
              .getAttribute("aria-label")
          ).startsWith(score + " out of 100"),
        );
      }
      await page
        .locator(".sample-candidate")
        .filter({ hasText: "Marcus Vance" })
        .click();
      await page
        .getByRole("button", { name: "Rank the sample CVs", exact: true })
        .click();
      assert(
        (await page.locator(".sample-candidate").first().innerText()).includes(
          "Alex Rivera",
        ),
      );
      assert.equal(
        await page.locator("#sample-candidate-heading").innerText(),
        "Marcus Vance",
        "Ranking preserves the inspected candidate",
      );
      await page
        .getByRole("button", { name: "Reset the example", exact: true })
        .click();
      assert(
        (await page.locator(".sample-candidate").first().innerText()).includes(
          "Elena Rostova",
        ),
      );
      const elena = page
        .locator(".sample-candidate")
        .filter({ hasText: "Elena Rostova" });
      await elena.focus();
      await page.keyboard.press("Enter");
      assert.equal(await elena.getAttribute("aria-pressed"), "true");
      assert(
        (await page.locator(".sample-excerpt").innerText()).includes(
          "LLM-powered search",
        ),
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      const canonical = await page
        .locator("link[rel=canonical]")
        .getAttribute("href");
      assert.equal(new URL(canonical).pathname, "/sample");
      assert.equal(
        await page.locator('meta[property="og:url"]').getAttribute("content"),
        canonical,
      );
      assert((await page.title()).includes("Try the CV screening sample"));
      assert(
        (
          await page.locator('meta[name="robots"]').getAttribute("content")
        ).includes("index"),
      );
      if (width === 390 || width === 1440) {
        const audit = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        const violations = audit.violations.flatMap((v) =>
          v.nodes
            .filter(
              (n) =>
                !(
                  v.id === "color-contrast" &&
                  n.target.every(
                    (t) =>
                      typeof t === "string" &&
                      t.includes(".wordmark") &&
                      t.includes(".wordmark-fits"),
                  )
                ),
            )
            .map((n) => ({
              rule: v.id,
              target: n.target,
              summary: n.failureSummary,
            })),
        );
        await writeFile(
          `artifacts/sample-page/axe-${engineName}-${width}.json`,
          JSON.stringify({ violations }, null, 2),
        );
        assert.deepEqual(violations, []);
        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement)
            document.activeElement.blur();
          window.scrollTo({ top: 0, behavior: "instant" });
        });
        await page.screenshot({
          path: `artifacts/sample-page/final-${engineName}-${width}.png`,
          fullPage: true,
        });
      }
      if (width < 1024) {
        await page.getByRole("button", { name: "Open navigation" }).click();
        const link = page
          .getByRole("navigation", { name: "Mobile navigation" })
          .getByRole("link", { name: "Try the sample", exact: true });
        assert.equal(await link.getAttribute("href"), "/sample");
        assert.equal(await link.getAttribute("aria-current"), "page");
        await link.click();
        await page.locator("dialog[open]").waitFor({ state: "hidden" });
      }
      await page
        .getByRole("link", { name: "Back to home", exact: true })
        .click();
      await page.waitForURL(base + "/");
      await page.goBack();
      await page.waitForURL("**/sample");
      report.push({ engine: engineName, width, status: "passed" });
    }
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto(base + "/sample", { waitUntil: "networkidle" });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
      "auto",
    );
    for (const route of ["/login", "/signup"]) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      assert.equal(
        await page
          .getByRole("link", { name: "Explore the sample first", exact: true })
          .getAttribute("href"),
        "/sample",
      );
    }
    const response = await context.request.get(base + "/sample");
    assert.equal(response.status(), 200);
    const html = await response.text();
    assert(
      html.includes("See a shortlist take shape.") &&
        html.includes("Alex Rivera") &&
        html.includes("fictional"),
    );
    assert(
      (
        await (await context.request.get(base + "/sitemap.xml")).text()
      ).includes("/sample"),
    );
    assert.deepEqual(apiRequests, [], "The public sample must not call an API");
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}
await writeFile(
  "artifacts/sample-page/checks.json",
  JSON.stringify(report, null, 2),
);
console.log(
  `PASS: ${report.length} Chromium/WebKit sample layouts, navigation/back history, all candidate selections, ranking/reset, keyboard control, SSR/SEO, mobile navigation, accessibility, and no API requests.`,
);
