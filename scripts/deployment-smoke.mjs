import assert from "node:assert/strict";
import { chromium } from "playwright";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile, rm, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { deploymentOrigin } from "./cloudflare-deployment.mjs";
import { pdfFixture, docxFixture } from "./fixtures.mjs";

const base = deploymentOrigin(process.env.DEPLOYMENT_SMOKE_URL);
const temporary = await mkdtemp(path.join(tmpdir(), "whichcvfits-hosted-"));
const email = "deployment-smoke." + randomUUID() + "@example.invalid";
const password = randomUUID() + randomUUID() + "Aa!";
const otherEmail = "deployment-smoke." + randomUUID() + "@example.invalid";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
function quote(value) {
  return "'" + value.replaceAll("'", "''") + "'";
}
async function executeSql(sql) {
  const file = path.join(temporary, "fixture.sql");
  await writeFile(file, sql);
  const result = spawnSync(
    "node_modules/.bin/wrangler",
    [
      "d1",
      "execute",
      "whichcvfits-db",
      "--remote",
      ...(/^\s*SELECT/i.test(sql) ? ["--command", sql] : ["--file", file]),
      "--json",
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: "false",
        WRANGLER_LOG_PATH: ".wrangler/logs",
      },
    },
  );
  if (result.status !== 0)
    throw new Error(
      "Synthetic D1 fixture operation failed; recovery SQL remains at " + file,
    );
  // Remote SQL upload prints progress before its final JSON array.
  const jsonStart = result.stdout.search(/^\[/m);
  if (jsonStart < 0) throw new Error("D1 did not return a JSON result.");
  return JSON.parse(result.stdout.slice(jsonStart));
}
async function api(route, body, method = body ? "POST" : "GET", origin = base) {
  const response = await context.request.fetch(base + route, {
    method,
    headers: { Origin: origin },
    ...(body ? { data: body } : {}),
  });
  return { response, data: await response.json() };
}
try {
  await page.goto(base + "/", { waitUntil: "networkidle" });
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(
    new URL(await page.locator("link[rel=canonical]").getAttribute("href"))
      .origin,
    base,
  );
  assert.equal(
    (await context.request.get(base + "/sitemap.xml")).status(),
    200,
  );
  assert(
    (await (await context.request.get(base + "/sitemap.xml")).text()).includes(
      base,
    ),
  );
  const gate = await context.request.get(base + "/dashboard", {
    maxRedirects: 0,
  });
  assert([302, 303, 307, 308].includes(gate.status()));
  assert(gate.headers().location.includes("/login"));
  assert.equal((await api("/api/evaluate")).response.status(), 401);
  const signup = await api("/api/auth", {
    action: "signup",
    name: "Deployment smoke fixture",
    email,
    password,
  });
  assert.equal(
    signup.response.status(),
    200,
    "Hosted signup failed; inspect Worker resource limits and runtime configuration.",
  );
  const cookies = signup.response.headers()["set-cookie"] || "";
  assert(
    /HttpOnly/i.test(cookies) &&
      /Secure/i.test(cookies) &&
      /SameSite=Lax/i.test(cookies),
  );
  const account = await api("/api/auth");
  assert.equal(account.data.user.email, email);
  assert.equal(account.data.keys.length, 0);
  assert.equal(
    (await api("/api/keys", { action: "skip_onboarding" })).response.status(),
    200,
  );
  assert.equal(
    (
      await api(
        "/api/auth",
        { action: "logout" },
        "POST",
        "https://untrusted.example",
      )
    ).response.status(),
    403,
  );
  const missingKey = await api("/api/evaluate", {
    requestId: randomUUID(),
    jobTitle: "Synthetic engineer",
    requirementText: "Review professional TypeScript and Python experience.",
    provider: "google",
    modelId: "gemini-3.8-flash",
    effort: "medium",
    minPassScore: 70,
    weights: { skills: 40, experience: 30, impact: 20, education: 10 },
    dealbreakers: ["TypeScript"],
    cvs: [
      {
        id: "synthetic",
        fileName: "Synthetic.txt",
        rawText:
          "Synthetic candidate built TypeScript applications and Python APIs professionally.",
      },
    ],
  });
  assert.equal(missingKey.response.status(), 402);
  assert.equal((await api("/api/evaluate")).data.jobs.length, 0);
  await page.goto(base + "/dashboard", { waitUntil: "networkidle" });
  assert(
    (await page.locator("meta[name=robots]").getAttribute("content")).includes(
      "noindex",
    ),
  );
  await page
    .getByLabel("Start from a sample")
    .selectOption("senior-ai-fullstack");
  await page.getByRole("tab", { name: "2. CVs (0)", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles([
    {
      name: "Synthetic PDF.pdf",
      mimeType: "application/pdf",
      buffer: pdfFixture(),
    },
    {
      name: "Synthetic Unicode.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: docxFixture(),
    },
  ]);
  await page
    .getByText("Synthetic PDF.pdf", { exact: true })
    .waitFor({ timeout: 45000 });
  await page.getByText("Synthetic Unicode.docx", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Review Synthetic PDF.pdf", exact: true })
    .click();
  assert(
    (await page.getByLabel("Complete CV text").inputValue()).includes(
      "Candidate Example",
    ),
  );
  await page.keyboard.press("Escape");
  await page.locator("dialog[open]").waitFor({ state: "hidden" });
  assert(
    await page
      .getByRole("button", { name: "Review Synthetic PDF.pdf", exact: true })
      .evaluate((el) => el === document.activeElement),
  );
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "Hosted workspace overflow at " + width,
    );
  }
  const jobId = randomUUID(),
    candidateId = randomUUID();
  await executeSql(`INSERT INTO evaluation_jobs(id,user_id,title,requirement_text,rubric_weights_json,provider_used,model_used,effort_used,total_candidates,shortlisted_count,status,created_at)
VALUES(${quote(jobId)},${quote(account.data.user.id)},'Hosted synthetic fixture','Review professional TypeScript experience','{"skills":40,"experience":30,"impact":20,"education":10}','google','saved-original-model','medium',1,1,'completed','2026-11-10T00:00:00Z');
INSERT INTO candidate_evaluations(id,job_id,candidate_name,file_name,raw_cv_text,overall_score,grade_tier,is_filtered_in,sub_scores_json,matched_skills_json,missing_skills_json,red_flags_json,evidence_quotes_json,executive_summary,recommendation_verdict,interview_questions_json,rank_order,created_at)
VALUES(${quote(candidateId)},${quote(jobId)},'Synthetic Candidate','fixture.txt','Synthetic professional TypeScript experience',80,'A',1,'{"skills":80,"experience":80,"impact":80,"education":80}','["TypeScript"]','[]','[]','[]','Synthetic fixture','Review','[]',1,'2026-11-10T00:00:00Z');`);
  const saved = await api("/api/evaluate?jobId=" + jobId);
  assert.equal(saved.response.status(), 200);
  assert(/no-store/.test(saved.response.headers()["cache-control"]));
  assert.equal(saved.data.job.modelUsed, "saved-original-model");
  assert.equal(saved.data.candidates[0].actualModel, null);
  assert.equal(saved.data.candidates[0].evidenceStatus, "legacy");
  const other = await browser.newContext();
  try {
    const second = await other.request.post(base + "/api/auth", {
      headers: { Origin: base },
      data: {
        action: "signup",
        name: "Deployment smoke fixture",
        email: otherEmail,
        password,
      },
    });
    assert.equal(second.status(), 200);
    assert.equal(
      (await other.request.get(base + "/api/evaluate?jobId=" + jobId)).status(),
      404,
    );
    assert.equal(
      (
        await other.request.delete(base + "/api/evaluate?jobId=" + jobId, {
          headers: { Origin: base },
        })
      ).status(),
      404,
    );
  } finally {
    await other.close();
  }
  assert.equal(
    (
      await api("/api/evaluate?jobId=" + jobId, undefined, "DELETE")
    ).response.status(),
    200,
  );
  assert.equal(
    (await api("/api/evaluate?jobId=" + jobId)).response.status(),
    404,
  );
  const remaining = await executeSql(
    "SELECT COUNT(*) AS remaining FROM candidate_evaluations WHERE id=" +
      quote(candidateId),
  );
  assert.equal(remaining[0].results[0].remaining, 0);
  await api("/api/auth", { action: "logout" });
  assert.equal((await api("/api/auth")).data.authenticated, false);
  const login = await api("/api/auth", { action: "login", email, password });
  assert.equal(
    login.response.status(),
    200,
    "Hosted password verification failed.",
  );
  await api("/api/auth", { action: "logout" });
  assert.deepEqual(errors, []);
  await mkdir("artifacts/deployment", { recursive: true });
  await writeFile(
    "artifacts/deployment/smoke.json",
    JSON.stringify(
      {
        origin: base,
        verifiedAt: new Date().toISOString(),
        status: "passed",
        checks: [
          "public SSR and canonical",
          "sitemap",
          "server protection",
          "signup/login/logout",
          "secure cookies",
          "D1 persistence",
          "saved model and legacy metadata",
          "cross-owner read/delete isolation",
          "atomic run/candidate deletion",
          "onboarding skip",
          "origin rejection",
          "verified-key gate",
          "local PDF/DOCX and Unicode",
          "dialog Escape/focus",
          "320/390/768/1280 workspace reflow",
        ],
        liveProviderCalls: false,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: hosted authentication, secure sessions, D1 persistence, origin checks, local PDF/DOCX parsing, modal focus, responsive reflow and public SEO. No AI-provider calls were made.",
  );
} finally {
  await browser.close();
  // Cleanup is attempted even when signup failed after a partial database write.
  await executeSql(
    "DELETE FROM users WHERE email IN (" +
      [email, otherEmail].map(quote).join(",") +
      ") AND name='Deployment smoke fixture';",
  );
  await rm(temporary, { recursive: true, force: true });
}
