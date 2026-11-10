import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
const base = process.env.WORKER_QA_URL || "http://localhost:8787";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("This smoke test only permits a local Worker.");
const temporary = await mkdtemp(path.join(tmpdir(), "whichcvfits-worker-"));
function quote(value) {
  return "'" + value.replaceAll("'", "''") + "'";
}
async function sql(statement) {
  const file = path.join(temporary, "fixture.sql");
  await writeFile(file, statement);
  const result = spawnSync(
    "node_modules/.bin/wrangler",
    ["d1", "execute", "whichcvfits-db", "--local", "--file", file, "--json"],
    { encoding: "utf8" },
  );
  if (result.status !== 0)
    throw new Error(
      "Local D1 fixture operation failed: " + result.stderr.slice(0, 300),
    );
  return JSON.parse(result.stdout);
}
async function api(route, body, cookie = "", method = body ? "POST" : "GET") {
  const response = await fetch(base + route, {
    method,
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { response, data: await response.json() };
}
const email = "worker-smoke." + randomUUID() + "@example.com";
const otherEmail = "worker-smoke." + randomUUID() + "@example.com";
const password = randomUUID() + "Aa!";
let userId, otherId;
try {
  assert.equal((await api("/api/evaluate")).response.status, 401);
  const signup = await api("/api/auth", {
    action: "signup",
    name: "Worker QA",
    email,
    password,
  });
  assert.equal(signup.response.status, 200);
  const cookie = signup.response.headers.get("set-cookie").split(";")[0];
  const account = await api("/api/auth", undefined, cookie);
  userId = account.data.user.id;
  assert.equal(account.data.user.email, email);
  assert.equal(
    (await api("/api/keys", { action: "skip_onboarding" }, cookie)).response
      .status,
    200,
  );
  const dashboard = await fetch(base + "/dashboard", {
    headers: { Cookie: cookie },
  });
  assert.equal(dashboard.status, 200);
  assert((await dashboard.text()).includes("noindex"));
  const second = await api("/api/auth", {
    action: "signup",
    name: "Other QA",
    email: otherEmail,
    password,
  });
  assert.equal(second.response.status, 200);
  const secondCookie = second.response.headers.get("set-cookie").split(";")[0];
  otherId = (await api("/api/auth", undefined, secondCookie)).data.user.id;
  const job = randomUUID(),
    candidate = randomUUID();
  await sql(`INSERT INTO evaluation_jobs(id,user_id,title,requirement_text,rubric_weights_json,provider_used,model_used,effort_used,total_candidates,shortlisted_count,status,created_at)
VALUES(${quote(job)},${quote(userId)},'Worker persistence fixture','Review professional TypeScript experience','{"skills":40,"experience":30,"impact":20,"education":10}','google','saved-original-model','medium',1,1,'completed','2026-11-10T00:00:00Z');
INSERT INTO candidate_evaluations(id,job_id,candidate_name,file_name,raw_cv_text,overall_score,grade_tier,is_filtered_in,sub_scores_json,matched_skills_json,missing_skills_json,red_flags_json,evidence_quotes_json,executive_summary,recommendation_verdict,interview_questions_json,rank_order,created_at)
VALUES(${quote(candidate)},${quote(job)},'Synthetic Candidate','fixture.txt','Synthetic professional TypeScript experience',80,'A',1,'{"skills":80,"experience":80,"impact":80,"education":80}','["TypeScript"]','[]','[]','[]','Synthetic fixture','Review','[]',1,'2026-11-10T00:00:00Z');`);
  const run = await api("/api/evaluate?jobId=" + job, undefined, cookie);
  assert.equal(run.response.status, 200);
  assert.equal(run.data.job.modelUsed, "saved-original-model");
  assert.equal(run.data.candidates.length, 1);
  assert.equal(run.data.candidates[0].actualModel, null);
  assert.equal(run.data.candidates[0].evidenceStatus, "legacy");
  assert(
    (await api("/api/evaluate", undefined, cookie)).data.jobs.some(
      (item) => item.id === job,
    ),
  );
  assert.equal(
    (await api("/api/evaluate?jobId=" + job, undefined, secondCookie)).response
      .status,
    404,
  );
  assert.equal(
    (await api("/api/evaluate?jobId=" + job, undefined, secondCookie, "DELETE"))
      .response.status,
    404,
  );
  assert.equal(
    (await api("/api/evaluate?jobId=" + job, undefined, cookie, "DELETE"))
      .response.status,
    200,
  );
  assert.equal(
    (await api("/api/evaluate?jobId=" + job, undefined, cookie)).response
      .status,
    404,
  );
  const rows = await sql(
    "SELECT COUNT(*) AS remaining FROM candidate_evaluations WHERE id=" +
      quote(candidate),
  );
  assert.equal(rows[0].results[0].remaining, 0);
  assert.equal(
    (await api("/api/auth", { action: "logout" }, cookie)).response.status,
    200,
  );
  const login = await api("/api/auth", { action: "login", email, password });
  assert.equal(login.response.status, 200);
  console.log(
    "PASS: local Worker/D1 authentication, onboarding, protected SSR, saved model/legacy metadata, history, owner isolation, atomic owner deletion and candidate cleanup.",
  );
} finally {
  const emails = [email, otherEmail].map(quote).join(",");
  await sql("DELETE FROM users WHERE email IN (" + emails + ");");
  await rm(temporary, { recursive: true, force: true });
}
