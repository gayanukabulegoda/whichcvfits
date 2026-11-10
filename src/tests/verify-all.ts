import assert from "node:assert/strict";
import {
  deploymentOrigin,
  requireDeploymentDatabase,
} from "../../scripts/cloudflare-deployment.mjs";
import { publicWorkerEnvironment } from "../../scripts/cloudflare-env.mjs";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { zipSync, strToU8, Zip, ZipDeflate } from "fflate";
import {
  encryptApiKey,
  decryptApiKey,
  hashPassword,
  verifyPassword,
} from "../lib/crypto.ts";
import { signToken, verifyToken } from "../lib/session-token.ts";
import { getDatabase } from "../db/node.ts";
import {
  gradeProviderResult,
  evaluateCvBatch,
  rankCandidates,
  verifyProviderApiKey,
  hasAffirmativeMention,
} from "../lib/llm/evaluator.ts";
import { getModelsForProvider } from "../lib/llm/catalog.ts";
import { responseSchemaFor } from "../lib/llm/response-schema.ts";
import {
  evaluationSchema,
  normalizeWeights,
  DEFAULT_WEIGHTS,
  type ProviderResult,
  type EvaluationInput,
  type EvaluationRun,
} from "../lib/contracts.ts";
import { parseCvFileBuffer } from "../lib/parsers/cv-parser.ts";
import { candidatesCsv, csvCell } from "../lib/csv.ts";
import { saveRun, loadRun, listRuns, deleteRun } from "../lib/repository.ts";

const temp = mkdtempSync(path.join(tmpdir(), "whichcvfits-tests-"));
process.env.WHICHCVFITS_DB_PATH = path.join(temp, "audit.db");
process.env.WHICHCVFITS_JWT_SECRET = "signing-" + crypto.randomUUID();
process.env.WHICHCVFITS_ENCRYPTION_SECRET = "vault-" + crypto.randomUUID();
let count = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  await fn();
  count++;
  console.log("✓ " + name);
}
const cv = {
  id: "cv-1",
  fileName: "Candidate.txt",
  rawText:
    "Alex Example\nSenior Engineer\nBuilt production TypeScript applications and Python APIs for seven years.\nNo experience with Kubernetes.\nBSc Computer Science.",
};
const input: EvaluationInput = {
  requestId: crypto.randomUUID(),
  jobTitle: "Senior engineer",
  requirementText: "Build TypeScript and Python applications.",
  provider: "google",
  modelId: "gemini-3.8-flash",
  effort: "medium",
  minPassScore: 70,
  weights: DEFAULT_WEIGHTS,
  dealbreakers: ["TypeScript"],
  cvs: [cv],
};
function result(overrides: Partial<ProviderResult> = {}): ProviderResult {
  return {
    candidateName: "Alex Example",
    candidateEmail: "alex@example.com",
    candidateRole: "Senior engineer",
    yearsExperience: "7 years",
    subScores: { skills: 90, experience: 90, impact: 90, education: 90 },
    matchedSkills: ["TypeScript", "Python"],
    missingSkills: ["Kubernetes"],
    redFlags: [],
    evidenceQuotes: [
      {
        requirement: "TypeScript",
        cvQuote:
          "Built production TypeScript applications and Python APIs for seven years.",
        strength: "strong",
      },
    ],
    dealbreakerAssessments: [
      {
        requirement: "TypeScript",
        status: "met",
        cvQuote:
          "Built production TypeScript applications and Python APIs for seven years.",
        explanation: "Affirmative evidence.",
      },
    ],
    executiveSummary: "Clear professional evidence of the required stack.",
    recommendationVerdict: "Explore production experience in an interview.",
    interviewQuestions: [1, 2, 3].map((n) => ({
      question: "Describe project " + n,
      targetGapOrSkill: "Production skills",
      whatToLookFor: "Specific examples.",
    })),
    reasoningLog: "Weighted professional criteria.",
    ...overrides,
  };
}
try {
  await check(
    "Deployment rejects missing or unsafe origins and placeholder databases",
    async () => {
      assert.equal(
        deploymentOrigin("https://whichcvfits.example.workers.dev/"),
        "https://whichcvfits.example.workers.dev",
      );
      for (const value of [
        undefined,
        "http://example.com",
        "https://localhost",
        "https://example.com/path",
        "https://user:pass@example.com",
        "https://example.com/?token=x",
      ])
        assert.throws(() => deploymentOrigin(value));
      assert.throws(() =>
        requireDeploymentDatabase(
          '{"database_id":"00000000-0000-0000-0000-000000000000"}',
        ),
      );
      assert.throws(() => requireDeploymentDatabase("{}"));
      requireDeploymentDatabase(
        '{"database_id":"12345678-1234-1234-1234-123456789abc"}',
      );
    },
  );
  await check(
    "Worker environment artifacts retain public configuration and reject private dotenv values",
    async () => {
      const source = ["production", "development", "test"]
        .map(
          (mode) =>
            "export const " +
            mode +
            " = " +
            JSON.stringify({
              NEXT_PUBLIC_SITE_URL: "https://example.com",
              WHICHCVFITS_JWT_SECRET: "private signing value",
              WHICHCVFITS_ENCRYPTION_SECRET: "private encryption value",
              DATABASE_URL: "private database value",
            }) +
            ";",
        )
        .join("\n");
      const output = publicWorkerEnvironment(source);
      assert(!output.includes("private"));
      assert.equal((output.match(/NEXT_PUBLIC_SITE_URL/g) || []).length, 3);
      assert.equal(publicWorkerEnvironment(output), output);
      assert.throws(() => publicWorkerEnvironment("unexpected format"));
    },
  );
  await check(
    "Provider wire schemas honor API subsets while local validation remains strict",
    () => {
      const claude = JSON.stringify(responseSchemaFor("anthropic"));
      for (const keyword of [
        '"minimum":',
        '"maximum":',
        '"maxItems":',
        '"minLength":',
        '"maxLength":',
      ])
        assert(!claude.includes(keyword));
      assert(claude.includes("Required local validation"));
      assert(
        JSON.stringify(responseSchemaFor("openai")).includes('"minimum":0'),
      );
      assert(
        !JSON.stringify(responseSchemaFor("google")).includes('"maxLength":'),
      );
      assert.throws(() =>
        gradeProviderResult(
          result({
            subScores: {
              skills: 101,
              experience: 90,
              impact: 90,
              education: 90,
            },
          }),
          cv,
          input,
        ),
      );
      const mixed = result();
      mixed.dealbreakerAssessments[0].status = "Met" as never;
      mixed.evidenceQuotes[0].strength = "Strong" as never;
      assert.equal(
        gradeProviderResult(mixed, cv, input).passedDealbreakers,
        true,
      );
    },
  );
  await check(
    "Negation across dotted skill names and whole-word skill boundaries",
    () => {
      assert.equal(
        hasAffirmativeMention(
          "No production experience with React, Next.js, or TypeScript frontend frameworks.",
          "TypeScript",
        ),
        false,
      );
      assert.equal(
        hasAffirmativeMention("Worked with Google services.", "Go"),
        false,
      );
      assert.equal(
        hasAffirmativeMention(
          "Built production systems in Go and TypeScript.",
          "Go",
        ),
        true,
      );
      assert.equal(
        hasAffirmativeMention("No Python experience.", "Python"),
        false,
      );
      assert.equal(
        hasAffirmativeMention(
          "Built Python services. No Kubernetes experience.",
          "Python",
        ),
        true,
      );
    },
  );
  await check(
    "AES-GCM round trip, randomized IV, and tamper rejection",
    async () => {
      const a = await encryptApiKey("private-provider-credential"),
        b = await encryptApiKey("private-provider-credential");
      assert.notEqual(a.encryptedKey, b.encryptedKey);
      assert.equal(
        await decryptApiKey(a.encryptedKey, a.iv),
        "private-provider-credential",
      );
      await assert.rejects(() =>
        decryptApiKey(a.encryptedKey.slice(0, -2) + "ff", a.iv),
      );
      assert(!a.keyHint.includes("credential"));
    },
  );
  await check(
    "Password compatibility and malformed hash rejection",
    async () => {
      const hash = await hashPassword("a long test passphrase");
      assert(await verifyPassword("a long test passphrase", hash));
      assert(!(await verifyPassword("wrong", hash)));
      assert(!(await verifyPassword("anything", "invalid:hash")));
    },
  );
  await check(
    "Sessions reject forged, extra-segment, expired, and invalid-expiry tokens",
    async () => {
      const token = await signToken({
        userId: "owner",
        name: "Owner",
        email: "owner@example.com",
        exp: Date.now() + 60000,
      });
      assert.equal((await verifyToken(token))?.userId, "owner");
      assert.equal(await verifyToken(token + ".extra"), null);
      assert.equal(await verifyToken("a." + token.split(".")[1]), null);
      assert.equal(
        await verifyToken(
          await signToken({
            userId: "owner",
            name: "Owner",
            email: "owner@example.com",
            exp: 0,
          }),
        ),
        null,
      );
      assert.equal(
        await verifyToken(
          await signToken({
            userId: "owner",
            name: "Owner",
            email: "owner@example.com",
            exp: NaN,
          }),
        ),
        null,
      );
    },
  );
  await check("Strict request limits and nonzero, normalized weights", () => {
    assert.equal(evaluationSchema.safeParse(input).success, true);
    assert.equal(
      evaluationSchema.safeParse({
        ...input,
        weights: { ...DEFAULT_WEIGHTS, skills: -1 },
      }).success,
      false,
    );
    assert.throws(() =>
      normalizeWeights({ skills: 0, experience: 0, impact: 0, education: 0 }),
    );
    assert.equal(
      Object.values(
        normalizeWeights({
          skills: 10,
          experience: 10,
          impact: 10,
          education: 10,
        }),
      ).reduce((a, b) => a + b),
      100,
    );
    assert.equal(
      evaluationSchema.safeParse({
        ...input,
        cvs: [{ ...cv, rawText: "x".repeat(50001) }],
      }).success,
      false,
    );
    assert.equal(
      evaluationSchema.safeParse({
        ...input,
        cvs: Array.from({ length: 21 }, (_, i) => ({ ...cv, id: String(i) })),
      }).success,
      false,
    );
  });
  await check(
    "Mandatory-rule failure caps score and blocks shortlist at any threshold",
    () => {
      const graded = gradeProviderResult(
        result({
          dealbreakerAssessments: [
            {
              requirement: "TypeScript",
              status: "unclear",
              cvQuote: "",
              explanation: "Not evidenced.",
            },
          ],
        }),
        cv,
        { ...input, minPassScore: 0 },
      );
      assert.equal(graded.overallScore, 45);
      assert.equal(graded.fitTier, "disqualified");
      assert.equal(graded.isFilteredIn, false);
    },
  );
  await check("A negated skill quote cannot satisfy a must-have", () => {
    const graded = gradeProviderResult(
      result({
        matchedSkills: ["Kubernetes"],
        dealbreakerAssessments: [
          {
            requirement: "Kubernetes",
            status: "met",
            cvQuote: "No experience with Kubernetes.",
            explanation: "Mistaken provider assertion.",
          },
        ],
      }),
      cv,
      { ...input, dealbreakers: ["Kubernetes"] },
    );
    assert.equal(graded.passedDealbreakers, false);
    assert.equal(graded.matchedSkills.length, 0);
  });
  await check(
    "Reject fabricated quotes, missing criteria, out-of-range scores, and malformed output",
    () => {
      assert.throws(() =>
        gradeProviderResult(
          result({
            evidenceQuotes: [
              {
                requirement: "Python",
                cvQuote: "I invented this quote.",
                strength: "strong",
              },
            ],
          }),
          cv,
          input,
        ),
      );
      assert.throws(() =>
        gradeProviderResult(result({ dealbreakerAssessments: [] }), cv, input),
      );
      assert.throws(() =>
        gradeProviderResult(
          result({
            subScores: {
              skills: 101,
              experience: 90,
              impact: 90,
              education: 90,
            },
          }),
          cv,
          input,
        ),
      );
      assert.throws(() => gradeProviderResult({}, cv, input));
    },
  );
  await check(
    "Fit tiers, eligibility ordering, and stable tie-breakers",
    () => {
      const top = gradeProviderResult(result(), cv, input);
      assert.equal(top.fitTier, "top_fit");
      const fail = gradeProviderResult(
        result({
          dealbreakerAssessments: [
            {
              requirement: "TypeScript",
              status: "unclear",
              cvQuote: "",
              explanation: "Missing",
            },
          ],
        }),
        { ...cv, id: "z" },
        input,
      );
      const low = { ...top, overallScore: 20, inputId: "a" };
      const tied = { ...top, inputId: "b" };
      assert.equal(rankCandidates([fail, low])[0].inputId, "a");
      assert.deepEqual(
        rankCandidates([tied, top]).map((c) => c.inputId),
        rankCandidates([top, tied]).map((c) => c.inputId),
      );
    },
  );
  await check(
    "Bounded concurrency of three, partial failures, and deterministic completion ordering",
    async () => {
      let active = 0,
        max = 0;
      const cvs = Array.from({ length: 7 }, (_, i) => ({
        ...cv,
        id: "cv-" + i,
      }));
      const batch = await evaluateCvBatch(
        { ...input, cvs, apiKey: "unused-in-injected-transport" },
        async (_p, c) => {
          active++;
          max = Math.max(max, active);
          await new Promise((r) => setTimeout(r, 5));
          active--;
          if (c.id === "cv-3") throw new Error("Mock outage");
          return result();
        },
      );
      assert.equal(max, 3);
      assert.equal(batch.candidates.length, 6);
      assert.equal(batch.failures.length, 1);
      assert.equal(batch.failures[0].inputId, "cv-3");
      await assert.rejects(() =>
        evaluateCvBatch(
          { ...input, modelId: "unknown", apiKey: "unused" },
          async () => result(),
        ),
      );
      await assert.rejects(() =>
        evaluateCvBatch(
          { ...input, apiKey: "unused", discoveredModels: ["another-model"] },
          async () => result(),
        ),
      );
    },
  );
  await check(
    "Production key verification fails closed on network loss and rejects simulation keys",
    async () => {
      const original = globalThis.fetch;
      globalThis.fetch = async () => {
        throw new Error("offline");
      };
      try {
        assert.equal(
          (await verifyProviderApiKey("google", "AIza" + "z".repeat(35))).valid,
          false,
        );
        assert.equal(
          (await verifyProviderApiKey("google", "AIzaSyTestGoogleKey")).valid,
          false,
        );
      } finally {
        globalThis.fetch = original;
      }
    },
  );
  await check(
    "Each provider sends its exact selected model and supported reasoning controls",
    async () => {
      const original = globalThis.fetch;
      for (const provider of ["google", "anthropic", "openai"] as const) {
        const model = getModelsForProvider(provider)[0];
        let body: Record<string, unknown> = {};
        globalThis.fetch = async (_url, options) => {
          body = JSON.parse(String(options?.body));
          return Response.json(
            provider === "google"
              ? {
                  candidates: [
                    {
                      content: { parts: [{ text: JSON.stringify(result()) }] },
                      finishReason: "STOP",
                    },
                  ],
                }
              : provider === "anthropic"
                ? {
                    content: [{ type: "text", text: JSON.stringify(result()) }],
                    stop_reason: "end_turn",
                  }
                : {
                    choices: [
                      {
                        message: { content: JSON.stringify(result()) },
                        finish_reason: "stop",
                      },
                    ],
                  },
          );
        };
        try {
          const r = await evaluateCvBatch({
            ...input,
            provider,
            modelId: model.id,
            apiKey: "unused",
          });
          assert.equal(r.candidates.length, 1);
          assert.equal(r.candidates[0].actualModel, model.id);
          if (provider === "google")
            assert.equal(
              (
                body.generationConfig as {
                  thinkingConfig: { thinkingLevel: string };
                }
              ).thinkingConfig.thinkingLevel,
              "medium",
            );
          if (provider === "anthropic")
            assert.equal(
              (body.output_config as { effort: string }).effort,
              "medium",
            );
          if (provider === "openai")
            assert.equal(body.reasoning_effort, "medium");
        } finally {
          globalThis.fetch = original;
        }
      }
    },
  );
  await check(
    "Transient network and HTTP failures retry once; oversized provider output is rejected",
    async () => {
      const original = globalThis.fetch;
      try {
        for (const mode of ["network", "http"] as const) {
          let calls = 0;
          globalThis.fetch = async () => {
            if (++calls === 1) {
              if (mode === "network")
                throw new TypeError("network interrupted");
              return new Response("temporary", { status: 503 });
            }
            return Response.json({
              candidates: [
                {
                  content: { parts: [{ text: JSON.stringify(result()) }] },
                  finishReason: "STOP",
                },
              ],
            });
          };
          const batch = await evaluateCvBatch({ ...input, apiKey: "unused" });
          assert.equal(calls, 2);
          assert.equal(batch.candidates.length, 1);
        }
        globalThis.fetch = async () =>
          new Response(" ".repeat(1024 * 1024 + 1));
        const rejected = await evaluateCvBatch({ ...input, apiKey: "unused" });
        assert.equal(rejected.candidates.length, 0);
        assert(rejected.failures[0].error.includes("large response"));
      } finally {
        globalThis.fetch = original;
      }
    },
  );
  await check("Provider outages do not create local scores", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      Response.json(
        { error: { message: "private credential must not leak" } },
        { status: 401 },
      );
    try {
      const r = await evaluateCvBatch({ ...input, apiKey: "unused" });
      assert.equal(r.candidates.length, 0);
      assert.equal(r.failures.length, 1);
      assert(!r.failures[0].error.includes("private credential"));
    } finally {
      globalThis.fetch = original;
    }
  });
  await check(
    "DOCX central-directory/data-descriptor handling and Unicode text",
    async () => {
      const xml =
        '<?xml version="1.0"?><w:document xmlns:w="word"><w:body><w:p><w:r><w:t>தமிழ் candidate — Python &amp; TypeScript professional experience.</w:t></w:r></w:p><w:p><w:r><w:t>Second paragraph with evidence.</w:t></w:r></w:p></w:body></w:document>';
      const bytes = zipSync({ "word/document.xml": strToU8(xml) });
      const streamed = await new Promise<Uint8Array>((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        const zip = new Zip((error, chunk, final) => {
          if (error) return reject(error);
          chunks.push(chunk);
          if (final) {
            const output = new Uint8Array(
              chunks.reduce((sum, item) => sum + item.length, 0),
            );
            let offset = 0;
            for (const item of chunks) {
              output.set(item, offset);
              offset += item.length;
            }
            resolve(output);
          }
        });
        const entry = new ZipDeflate("word/document.xml");
        zip.add(entry);
        entry.push(strToU8(xml), true);
        zip.end();
      });
      assert.equal(new DataView(streamed.buffer).getUint16(6, true) & 8, 8);
      const text = await parseCvFileBuffer("candidate.docx", bytes);
      assert.equal(await parseCvFileBuffer("streamed.docx", streamed), text);
      assert(text.includes("தமிழ்"));
      assert(text.includes("& TypeScript"));
      assert(text.includes("\n"));
      await assert.rejects(() =>
        parseCvFileBuffer("bad.docx", new Uint8Array([1, 2, 3])),
      );
      await assert.rejects(() =>
        parseCvFileBuffer("binary.txt", new Uint8Array(30)),
      );
      await assert.rejects(() =>
        parseCvFileBuffer("scan.pdf", strToU8("%PDF-1.4")),
      );
      assert(
        (
          await parseCvFileBuffer(
            "unicode.md",
            strToU8("தமிழ் candidate with Python professional experience"),
          )
        ).includes("தமிழ்"),
      );
      await assert.rejects(() =>
        parseCvFileBuffer("large.txt", new Uint8Array(5 * 1024 * 1024 + 1)),
      );
    },
  );
  await check("CSV escaping, Unicode, and formula-injection protection", () => {
    assert.equal(
      csvCell('=HYPERLINK("x")'),
      String.fromCharCode(34, 39) + '=HYPERLINK(""x"")"',
    );
    assert(csvCell(" +SUM(A1)").startsWith(String.fromCharCode(34, 39)));
    const csv = candidatesCsv([
      gradeProviderResult(
        result({ candidateName: 'தமிழ், "Example"' }),
        cv,
        input,
      ),
    ]);
    assert(csv.startsWith("\uFEFF"));
    assert(csv.includes('தமிழ், ""Example""'));
  });
  await check(
    "Backup-first legacy migration, account preservation, atomic writes, ownership, history and deletion",
    async () => {
      const legacy = new DatabaseSync(process.env.WHICHCVFITS_DB_PATH!);
      legacy.exec(readFileSync("migrations/0001_initial.sql", "utf8"));
      legacy
        .prepare(
          "INSERT INTO users (id,name,email,password_hash,created_at) VALUES ('owner','Existing account','owner@example.com','existing-hash','2026-01-01')",
        )
        .run();
      legacy.close();
      const db = await getDatabase();
      assert.equal(
        (
          await db.get<{ name: string }>("SELECT name FROM users WHERE id=?", [
            "owner",
          ])
        )?.name,
        "Existing account",
      );
      assert(readdirSync(temp).some((f) => f.includes(".backup-")));
      const candidate = gradeProviderResult(result(), cv, input);
      const run: EvaluationRun = {
        job: {
          id: crypto.randomUUID(),
          title: input.jobTitle,
          requirementText: input.requirementText,
          rubricWeights: input.weights,
          dealbreakers: input.dealbreakers,
          minPassScore: 70,
          providerUsed: "google",
          modelUsed: input.modelId,
          effortUsed: "medium",
          totalCandidates: 1,
          shortlistedCount: 1,
          status: "completed",
          createdAt: new Date().toISOString(),
          promptVersion: "test",
          requestId: input.requestId,
        },
        candidates: [candidate],
        failures: [],
      };
      await saveRun(db, "owner", run);
      assert.equal((await listRuns(db, "owner")).length, 1);
      assert.equal(
        (await loadRun(db, "owner", run.job.id))?.candidates[0].actualModel,
        input.modelId,
      );
      assert.equal(await loadRun(db, "intruder", run.job.id), null);
      assert.equal(await deleteRun(db, "intruder", run.job.id), false);
      await assert.rejects(() =>
        db.batch([
          { sql: "INSERT INTO rate_limits VALUES ('rollback',1,1)" },
          { sql: "INSERT INTO missing_table VALUES (1)" },
        ]),
      );
      assert.equal(
        await db.get("SELECT * FROM rate_limits WHERE bucket='rollback'"),
        null,
      );
      assert.equal(await deleteRun(db, "owner", run.job.id), true);
      assert.equal(
        (await db.all("SELECT * FROM candidate_evaluations")).length,
        0,
      );
    },
  );
  console.log(
    "\nAll " +
      count +
      " regression suites passed. Provider calls were mocked; no real credentials or candidate data were used.",
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
