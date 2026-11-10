import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { pdfFixture, docxFixture, multiPagePdfFixture } from "./fixtures.mjs";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3107";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(e.message));
await mkdir("artifacts/qa", { recursive: true });
const matrix = [];
async function overflow(label) {
  await page.locator("main h1").waitFor();
  const state = await page.evaluate(() => ({
    viewport: innerWidth,
    page: document.documentElement.scrollWidth,
    offenders: [...document.querySelectorAll("main *,header *,dialog[open] *")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1);
      })
      .slice(0, 8)
      .map((el) => ({ tag: el.tagName, text: el.textContent?.slice(0, 70) })),
  }));
  matrix.push({ label, ...state });
  assert(
    state.page <= state.viewport + 1,
    label + " overflow: " + JSON.stringify(state),
  );
}
async function axe(label) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  // WCAG 1.4.3 explicitly exempts text in a logo/brand name. Keep the
  // required emerald wordmark and record only this narrowly reviewed exception.
  const reviewedExceptions = [];
  const violations = results.violations
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes
        .filter((n) => {
          const logo =
            v.id === "color-contrast" &&
            n.target.every(
              (t) =>
                typeof t === "string" &&
                t.includes(".wordmark") &&
                t.includes(".wordmark-fits"),
            );
          if (logo)
            reviewedExceptions.push({
              rule: v.id,
              target: n.target,
              reason:
                "WCAG 1.4.3 logo/brand-name exception; exact #10B981 required by brand.",
            });
          return !logo;
        })
        .map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
    }))
    .filter((v) => v.nodes.length);
  await writeFile(
    "artifacts/qa/axe-" + label + ".json",
    JSON.stringify({ violations, reviewedExceptions }, null, 2),
  );
  assert.equal(
    violations.length,
    0,
    "Accessibility violations at " + label + ": " + JSON.stringify(violations),
  );
}
async function api(path, body, method = "POST", target = context) {
  const response = await target.request.fetch(base + path, {
    method,
    headers: { Origin: base, "Content-Type": "application/json" },
    ...(body ? { data: body } : {}),
  });
  return { status: response.status(), data: await response.json() };
}
try {
  await page.goto(base + "/dashboard");
  await page.waitForURL("**/login");
  await page.goto(base + "/signup");
  const email = "qa." + Date.now() + "@example.com";
  await page.getByLabel("Your name", { exact: true }).fill("QA Recruiter");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("A secure QA passphrase 2026!");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await page.waitForURL("**/onboarding");
  await page
    .getByRole("button", { name: "Skip for now and explore the studio" })
    .click();
  await page.waitForURL("**/dashboard");
  assert(
    await page
      .getByRole("button", { name: "Evaluate 0 CVs", exact: true })
      .first()
      .isDisabled(),
  );
  const emptyPayload = {
    requestId: crypto.randomUUID(),
    jobTitle: "QA engineer",
    requirementText: "Build TypeScript applications and Python APIs.",
    provider: "google",
    modelId: "gemini-3.8-flash",
    effort: "medium",
    weights: { skills: 40, experience: 30, impact: 20, education: 10 },
    dealbreakers: ["TypeScript"],
    minPassScore: 70,
    cvs: [
      {
        id: "qa-cv",
        fileName: "QA.txt",
        rawText:
          "QA Example\nEngineer\nBuilt production TypeScript and Python applications.",
      },
    ],
  };
  assert.equal((await api("/api/evaluate", emptyPayload)).status, 402);
  const cross = await context.request.post(base + "/api/auth", {
    headers: {
      Origin: "https://untrusted.example",
      "Content-Type": "application/json",
    },
    data: { action: "logout" },
  });
  assert.equal(cross.status(), 403);
  const inaccessible = await api("/api/keys", {
    provider: "google",
    apiKey: "AIza" + "q".repeat(36),
    preferredModel: "inaccessible-model",
  });
  assert.equal(inaccessible.status, 400);
  assert(inaccessible.data.error.includes("selected model"));
  assert.equal((await api("/api/auth", undefined, "GET")).data.keys.length, 0);
  await page.goto(base + "/settings");
  await page
    .getByRole("button", { name: "Connect Gemini", exact: true })
    .click();
  await page
    .getByLabel("Connect Gemini API key", { exact: true })
    .fill("AIza" + "q".repeat(36));
  await page
    .getByRole("button", { name: "Verify & connect", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert(
    await page
      .getByText("Your provider key is verified and connected.")
      .isVisible(),
  );
  const auth = await api("/api/auth", undefined, "GET");
  assert(
    auth.data.keys[0].keyHint &&
      !JSON.stringify(auth.data).includes("q".repeat(36)),
  );
  await page.goto(base + "/dashboard");
  await page
    .getByLabel("Start from a sample")
    .selectOption("senior-ai-fullstack");
  await page.getByRole("button", { name: "5 sample CVs", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles([
    { name: "Text CV.pdf", mimeType: "application/pdf", buffer: pdfFixture() },
    {
      name: "Unicode CV.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: docxFixture(),
    },
    {
      name: "Unreadable.pdf",
      mimeType: "application/pdf",
      buffer: pdfFixture(""),
    },
    {
      name: "Too-many-pages.pdf",
      mimeType: "application/pdf",
      buffer: multiPagePdfFixture(),
    },
    {
      name: "Notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "Notes Candidate\nEngineer\nBuilt production TypeScript and Python applications.",
      ),
    },
  ]);
  await page.getByText(/Page 1 has no readable text/).waitFor();
  await page.getByText(/30 pages/).waitFor();
  assert(await page.getByText("Text CV.pdf", { exact: true }).isVisible());
  assert(await page.getByText("Unicode CV.docx", { exact: true }).isVisible());
  await page
    .getByRole("button", { name: "Review Text CV.pdf", exact: true })
    .click();
  assert(
    (await page.getByLabel("Complete CV text").inputValue()).includes(
      "Candidate Example",
    ),
  );
  await page.keyboard.press("Escape");
  await page.locator("dialog[open]").waitFor({ state: "hidden" });
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert(
    await page
      .getByRole("button", { name: "Review Text CV.pdf", exact: true })
      .evaluate((el) => el === document.activeElement),
  );
  // A single unreadable file must not prevent readable CVs being queued.
  assert.equal(await page.getByRole("button", { name: /^Remove / }).count(), 8);
  // Inspect a real provider-backed run via the isolated test transport.
  await page
    .getByRole("button", { name: "Evaluate 8 CVs", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "View evidence", exact: true })
    .first()
    .waitFor({ timeout: 30000 });
  assert.equal(
    await page
      .getByRole("button", { name: "View evidence", exact: true })
      .count(),
    8,
  );
  const jobs = await api("/api/evaluate", undefined, "GET");
  const runId = jobs.data.jobs[0].id;
  const saved = await api("/api/evaluate?jobId=" + runId, undefined, "GET");
  assert.equal(saved.data.job.modelUsed, "gemini-3.8-flash");
  await page
    .getByRole("button", { name: "View evidence", exact: true })
    .first()
    .click();
  await axe("evidence");
  await page.keyboard.press("Escape");
  await page.locator("dialog[open]").waitFor({ state: "hidden" });
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("checkbox", { name: "Compare", exact: true })
    .nth(0)
    .check();
  await page
    .getByRole("checkbox", { name: "Compare", exact: true })
    .nth(1)
    .check();
  await page
    .getByRole("button", { name: "Compare (2/3)", exact: true })
    .click();
  await axe("comparison");
  await page.keyboard.press("Escape");
  await page.locator("dialog[open]").waitFor({ state: "hidden" });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  assert((await download).suggestedFilename().endsWith(".csv"));
  // The selected model can change without rewriting the saved-run label.
  await page.getByLabel("AI provider", { exact: true }).selectOption("openai");
  assert(
    (await page.locator("#panel-results").innerText()).includes(
      "gemini-3.8-flash",
    ),
  );
  await page.goto(base + "/dashboard?job=" + runId);
  await page
    .getByRole("button", { name: "View evidence", exact: true })
    .first()
    .waitFor();
  await axe("studio");
  // Partial retries preserve earlier successful evaluations and their original config.
  const partialPayload = {
    ...emptyPayload,
    requestId: crypto.randomUUID(),
    cvs: [
      emptyPayload.cvs[0],
      {
        ...emptyPayload.cvs[0],
        id: "retry-cv",
        fileName: "Fail once " + Date.now() + " CV.txt",
      },
    ],
  };
  const partial = await api("/api/evaluate", partialPayload);
  assert.equal(partial.data.job.status, "partial");
  assert.equal(partial.data.candidates.length, 1);
  const retried = await api("/api/evaluate", {
    ...partialPayload,
    requestId: crypto.randomUUID(),
    retryOf: partial.data.job.id,
    cvs: [partialPayload.cvs[1]],
  });
  assert.equal(retried.data.candidates.length, 2);
  assert.equal(retried.data.failures.length, 0);
  const replay = await api("/api/evaluate", {
    ...partialPayload,
    requestId: retried.data.job.requestId,
    retryOf: partial.data.job.id,
    cvs: [partialPayload.cvs[1]],
  });
  assert.equal(replay.data.job.id, retried.data.job.id);
  const other = await browser.newContext();
  const intruder = await api(
    "/api/auth",
    {
      action: "signup",
      name: "Other Recruiter",
      email: "other." + Date.now() + "@example.com",
      password: "Another secure passphrase!",
    },
    "POST",
    other,
  );
  assert.equal(intruder.status, 200);
  assert.equal(
    (await api("/api/evaluate?jobId=" + runId, undefined, "GET", other)).status,
    404,
  );
  assert.equal(
    (await api("/api/evaluate?jobId=" + runId, undefined, "DELETE", other))
      .status,
    404,
  );
  await other.close();
  for (const width of [320, 360, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/login",
      "/signup",
      "/onboarding",
      "/settings",
      "/how-it-works",
      "/privacy",
      "/dashboard?job=" + runId,
    ]) {
      await page.goto(base + path, { waitUntil: "networkidle" });
      if (path.startsWith("/dashboard"))
        await page
          .getByRole("button", { name: "View evidence", exact: true })
          .first()
          .waitFor();
      await overflow(width + " " + path);
      if (width === 390 || width === 1440)
        await page.screenshot({
          path:
            "artifacts/qa/" +
            (path === "/" ? "home" : path.split("?")[0].slice(1)) +
            "-" +
            width +
            ".png",
          fullPage: true,
        });
    }
    await page
      .getByRole("button", { name: "View evidence", exact: true })
      .first()
      .click();
    await overflow(width + " evidence dialog");
    await page.keyboard.press("Escape");
    await page.locator("dialog[open]").waitFor({ state: "hidden" });
    if (width < 768) {
      for (const step of ["1. Job", "2. CVs (0)", "3. Results"]) {
        await page.getByRole("tab", { name: step, exact: true }).click();
        await overflow(width + " " + step + " workspace panel");
      }
      await page.getByRole("button", { name: "Open navigation" }).click();
      await overflow(width + " mobile menu");
      await page.keyboard.press("Escape");
      await page.locator("dialog[open]").waitFor({ state: "hidden" });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/login",
    "/signup",
    "/onboarding",
    "/settings",
    "/how-it-works",
    "/privacy",
  ]) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await axe(route === "/" ? "home" : route.slice(1));
  }
  await page.goto(base + "/dashboard?job=" + runId);
  await page
    .getByRole("button", { name: "View evidence", exact: true })
    .first()
    .waitFor();
  await page.setViewportSize({ width: 844, height: 390 });
  await overflow("landscape studio");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
    "auto",
  );
  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByRole("tab", { name: "1. Job", exact: true }).click();
  await page.keyboard.press("ArrowRight");
  assert(
    (await page
      .getByRole("tab", { name: /2. CVs/ })
      .getAttribute("aria-selected")) === "true",
  );
  await page.getByRole("button", { name: "Paste text", exact: true }).click();
  await axe("paste-dialog");
  await page.keyboard.press("Escape");
  await page.locator("dialog[open]").waitFor({ state: "hidden" });
  await page.goto(base + "/settings");
  await page.getByRole("button", { name: "Replace key", exact: true }).click();
  await axe("key-dialog");
  await page.keyboard.press("Escape");
  await page.locator("dialog[open]").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await axe("delete-dialog");
  await page.keyboard.press("Escape");
  await page.locator("dialog[open]").waitFor({ state: "hidden" });
  await page.goto(base + "/");
  assert.equal(await page.locator("h1").count(), 1);
  assert(
    new URL(await page.locator("link[rel=canonical]").getAttribute("href"))
      .pathname === "/",
  );
  assert.equal(
    await page.locator('script[type="application/ld+json"]').count(),
    1,
  );
  const colors = await page
    .locator(".brand-logo .wordmark")
    .first()
    .evaluate((el) => [...el.children].map((c) => getComputedStyle(c).color));
  assert.deepEqual(colors, ["rgb(15, 23, 42)", "rgb(16, 185, 129)"]);
  for (const route of [
    "/login",
    "/signup",
    "/dashboard",
    "/settings",
    "/onboarding",
  ]) {
    await page.goto(base + route);
    assert(
      (
        await page.locator("meta[name=robots]").getAttribute("content")
      ).includes("noindex"),
    );
  }
  assert.equal(
    (await context.request.get(base + "/sitemap.xml")).status(),
    200,
  );
  assert.equal((await context.request.get(base + "/robots.txt")).status(), 200);
  assert.equal(
    (await context.request.get(base + "/opengraph-image")).status(),
    200,
  );
  assert.equal((await context.request.get(base + "/apple-icon")).status(), 200);
  // Owner deletion removes the run and candidate data.
  assert.equal(
    (
      await api(
        "/api/evaluate?jobId=" + retried.data.job.id,
        undefined,
        "DELETE",
      )
    ).status,
    200,
  );
  assert.equal(
    (await api("/api/evaluate?jobId=" + retried.data.job.id, undefined, "GET"))
      .status,
    404,
  );
  await api("/api/auth", { action: "logout" });
  await page.goto(base + "/dashboard");
  await page.waitForURL("**/login");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("A secure QA passphrase 2026!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard");
  const storageState = await context.storageState();
  const engineResults = [];
  for (const [engineName, engine] of [
    ["firefox", firefox],
    ["webkit", webkit],
  ]) {
    let engineBrowser;
    try {
      engineBrowser = await engine.launch({ headless: true });
    } catch (error) {
      engineResults.push({
        engine: engineName,
        status: "unavailable",
        reason: String(error.message).slice(0, 2000),
      });
      console.log(
        "UNAVAILABLE: " + engineName + " browser runtime could not launch.",
      );
      if (process.env.QA_REQUIRE_ALL_BROWSERS === "1") throw error;
      continue;
    }
    try {
      const engineContext = await engineBrowser.newContext({
        storageState,
        viewport: { width: 390, height: 844 },
      });
      const enginePage = await engineContext.newPage();
      await enginePage.goto(base + "/dashboard");
      await enginePage
        .getByLabel("Start from a sample")
        .selectOption("senior-ai-fullstack");
      await enginePage
        .getByRole("tab", { name: "2. CVs (0)", exact: true })
        .click();
      await enginePage.locator("input[type=file]").setInputFiles([
        {
          name: engineName + " CV.pdf",
          mimeType: "application/pdf",
          buffer: pdfFixture(),
        },
        {
          name: engineName + " CV.docx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          buffer: docxFixture(),
        },
      ]);
      await enginePage
        .getByText(engineName + " CV.pdf", { exact: true })
        .waitFor({ timeout: 30000 });
      await enginePage
        .getByText(engineName + " CV.docx", { exact: true })
        .waitFor();
      await enginePage
        .getByRole("button", {
          name: "Review " + engineName + " CV.pdf",
          exact: true,
        })
        .click();
      await enginePage.getByRole("dialog").waitFor({ state: "visible" });
      assert(
        (await enginePage.getByLabel("Complete CV text").inputValue()).includes(
          "Candidate Example",
        ),
      );
      await enginePage.keyboard.press("Escape");
      await enginePage.locator("dialog[open]").waitFor({ state: "hidden" });
      assert(
        await enginePage
          .getByRole("button", {
            name: "Review " + engineName + " CV.pdf",
            exact: true,
          })
          .evaluate((el) => el === document.activeElement),
      );
      assert(
        await enginePage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await enginePage
        .getByRole("button", { name: "Evaluate 2 CVs", exact: true })
        .filter({ visible: true })
        .click();
      await enginePage
        .getByRole("button", { name: "View evidence", exact: true })
        .first()
        .waitFor();
      await enginePage
        .getByRole("button", { name: "View evidence", exact: true })
        .first()
        .click();
      await enginePage.getByRole("dialog").waitFor({ state: "visible" });
      await enginePage.keyboard.press("Escape");
      await enginePage.locator("dialog[open]").waitFor({ state: "hidden" });
      for (const width of [320, 1280]) {
        await enginePage.setViewportSize({ width, height: 900 });
        await enginePage.goto(base + "/", { waitUntil: "networkidle" });
        assert(
          await enginePage.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
      }
      engineResults.push({ engine: engineName, status: "passed" });
      console.log(
        "PASS: " +
          engineName +
          " local PDF/DOCX, evaluation, modal keyboard/focus, and responsive smoke checks.",
      );
    } finally {
      await engineBrowser.close();
    }
  }
  const replacement = await api("/api/keys", {
    provider: "google",
    apiKey: "AIza" + "r".repeat(36),
    preferredModel: "gemini-3.8-flash",
    preferredEffort: "low",
  });
  assert.equal(replacement.status, 200);
  const replacedAuth = await api("/api/auth", undefined, "GET");
  assert.equal(replacedAuth.data.keys.length, 1);
  assert.equal(replacedAuth.data.user.preferredEffort, "low");
  assert(!JSON.stringify(replacedAuth.data).includes("r".repeat(36)));
  assert.equal(
    (await api("/api/keys?provider=google", undefined, "DELETE")).status,
    200,
  );
  assert.equal((await api("/api/auth", undefined, "GET")).data.keys.length, 0);
  await writeFile(
    "artifacts/qa/crossbrowser-summary.json",
    JSON.stringify(engineResults, null, 2),
  );
  assert.deepEqual(consoleErrors, []);
  await writeFile(
    "artifacts/qa/responsive-matrix.json",
    JSON.stringify(matrix, null, 2),
  );
  console.log(
    "PASS: authentication, BYOK gate, local PDF/DOCX parsing, mixed uploads, evaluations, evidence, comparison, CSV, history, partial retries, idempotency, ownership, deletion, SEO, keyboard dialogs, accessibility, and " +
      matrix.length +
      " responsive scenarios.",
  );
} catch (error) {
  await page.screenshot({ path: "artifacts/qa/failure.png", fullPage: true });
  console.log("Failure URL:", page.url());
  console.log(
    "Visible error context:",
    (await page.locator("main").innerText()).slice(-4000),
  );
  throw error;
} finally {
  await browser.close();
}
