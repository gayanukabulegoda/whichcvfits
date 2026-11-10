import { getDatabase, type Database, type ApiKeyRow } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { decryptApiKey } from "@/lib/crypto";
import {
  evaluationSchema,
  normalizeWeights,
  type EvaluationRun,
} from "@/lib/contracts";
import {
  evaluateCvBatch,
  rankCandidates,
  ProviderError,
  PROMPT_VERSION,
} from "@/lib/llm/evaluator";
import { listRuns, loadRun, saveRun, deleteRun } from "@/lib/repository";
import {
  apiError,
  json,
  checkOrigin,
  readJson,
  rateLimit,
  HttpError,
} from "@/lib/http";
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Please sign in.");
    const id = new URL(req.url).searchParams.get("jobId");
    const db = await getDatabase();
    if (!id) return json({ jobs: await listRuns(db, user.id) });
    const run = await loadRun(db, user.id, id);
    if (!run) throw new HttpError(404, "This evaluation was not found.");
    return json(run);
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(req: Request) {
  let reservation:
    | { db: Database; userId: string; requestId: string }
    | undefined;
  try {
    checkOrigin(req);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Please sign in.");
    const input = evaluationSchema.parse(await readJson(req, 4 * 1024 * 1024));
    const db = await getDatabase();
    const previous = await db.get<{ id: string }>(
      "SELECT id FROM evaluation_jobs WHERE request_id=? AND user_id=?",
      [input.requestId, user.id],
    );
    if (previous) return json(await loadRun(db, user.id, previous.id));
    let original: EvaluationRun | null = null;
    if (input.retryOf) {
      original = await loadRun(db, user.id, input.retryOf);
      if (!original)
        throw new HttpError(404, "The original run was not found.");
      const j = original.job;
      const w = normalizeWeights(input.weights);
      if (
        input.jobTitle !== j.title ||
        input.requirementText !== j.requirementText ||
        input.provider !== j.providerUsed ||
        input.modelId !== j.modelUsed ||
        input.effort !== j.effortUsed ||
        input.minPassScore !== j.minPassScore ||
        JSON.stringify(input.dealbreakers) !== JSON.stringify(j.dealbreakers) ||
        Object.keys(w).some(
          (k) =>
            Math.abs(
              w[k as keyof typeof w] - j.rubricWeights[k as keyof typeof w],
            ) > 0.000001,
        ) ||
        input.cvs.some(
          (c) => !original!.failures.some((f) => f.inputId === c.id),
        )
      )
        throw new HttpError(
          400,
          "A retry must use the original criteria and only failed CVs.",
        );
    }
    await rateLimit(req, "evaluate", 10, 10 * 60000, user.id);
    await db.run("DELETE FROM evaluation_requests WHERE expires_at < ?", [
      Date.now(),
    ]);
    const acquired = await db.get(
      "INSERT INTO evaluation_requests (user_id,request_id,expires_at) VALUES (?,?,?) ON CONFLICT(user_id,request_id) DO NOTHING RETURNING request_id",
      [user.id, input.requestId, Date.now() + 30 * 60000],
    );
    if (!acquired)
      throw new HttpError(
        409,
        "This evaluation is still running. Wait before retrying the same request.",
      );
    reservation = { db, userId: user.id, requestId: input.requestId };
    const key = await db.get<ApiKeyRow>(
      "SELECT * FROM api_keys WHERE user_id=? AND provider=? AND is_valid=1",
      [user.id, input.provider],
    );
    if (!key)
      throw new HttpError(
        402,
        "Connect a verified " +
          input.provider +
          " API key in Settings before evaluating.",
        "API_KEY_REQUIRED",
      );
    let apiKey: string;
    try {
      apiKey = await decryptApiKey(key.encrypted_key, key.iv);
    } catch {
      throw new HttpError(
        400,
        "This saved key could not be decrypted. Remove it and reconnect it in Settings.",
      );
    }
    const weights = normalizeWeights(input.weights);
    const result = await evaluateCvBatch({
      ...input,
      weights,
      apiKey,
      discoveredModels: JSON.parse(key.available_models_json),
    });
    if (original) {
      const attempted = new Set(input.cvs.map((c) => c.id));
      result.candidates = rankCandidates([
        ...original.candidates.map((c) => ({ ...c, id: crypto.randomUUID() })),
        ...result.candidates,
      ]);
      result.failures = [
        ...original.failures.filter((f) => !attempted.has(f.inputId)),
        ...result.failures,
      ];
    }
    const run: EvaluationRun = {
      job: {
        id: crypto.randomUUID(),
        title: input.jobTitle,
        requirementText: input.requirementText,
        rubricWeights: weights,
        dealbreakers: input.dealbreakers,
        minPassScore: input.minPassScore,
        providerUsed: input.provider,
        modelUsed: input.modelId,
        effortUsed: input.effort,
        totalCandidates: original?.job.totalCandidates || input.cvs.length,
        shortlistedCount: result.candidates.filter((c) => c.isFilteredIn)
          .length,
        status: result.failures.length
          ? result.candidates.length
            ? "partial"
            : "failed"
          : "completed",
        createdAt: new Date().toISOString(),
        promptVersion: PROMPT_VERSION,
        requestId: input.requestId,
      },
      ...result,
    };
    await saveRun(db, user.id, run);
    return json(run);
  } catch (error) {
    return error instanceof ProviderError
      ? json({ error: error.message, code: "PROVIDER_ERROR" }, 400)
      : apiError(error);
  } finally {
    if (reservation)
      await reservation.db.run(
        "DELETE FROM evaluation_requests WHERE user_id=? AND request_id=?",
        [reservation.userId, reservation.requestId],
      );
  }
}
export async function DELETE(req: Request) {
  try {
    checkOrigin(req);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Please sign in.");
    const id = new URL(req.url).searchParams.get("jobId");
    if (!id) throw new HttpError(400, "Choose an evaluation to delete.");
    if (!(await deleteRun(await getDatabase(), user.id, id)))
      throw new HttpError(404, "This evaluation was not found.");
    return json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
