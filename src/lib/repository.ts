import type { Database, SqlValue, Statement } from "../db/types.ts";
import type {
  EvaluationJob,
  EvaluationRun,
  GradedCandidate,
  EvaluationFailure,
} from "./contracts.ts";
type Row = Record<string, string | number | null>;
function parse<T>(value: unknown, fallback: T): T {
  try {
    return typeof value === "string" ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function jobFromRow(r: Row): EvaluationJob {
  return {
    id: String(r.id),
    title: String(r.title),
    requirementText: String(r.requirement_text),
    rubricWeights: parse(r.rubric_weights_json, {
      skills: 40,
      experience: 30,
      impact: 20,
      education: 10,
    }),
    dealbreakers: parse(r.dealbreakers_json, []),
    minPassScore: Number(r.min_pass_score),
    providerUsed: r.provider_used as EvaluationJob["providerUsed"],
    modelUsed: String(r.model_used),
    effortUsed: r.effort_used as EvaluationJob["effortUsed"],
    totalCandidates: Number(r.total_candidates),
    shortlistedCount: Number(r.shortlisted_count),
    status: r.status as EvaluationJob["status"],
    createdAt: String(r.created_at),
    promptVersion: r.prompt_version ? String(r.prompt_version) : null,
    requestId: r.request_id ? String(r.request_id) : null,
  };
}
function candidateFromRow(r: Row): GradedCandidate {
  const metadata = parse<Partial<GradedCandidate>>(r.metadata_json, {});
  return {
    id: String(r.id),
    inputId: metadata.inputId || String(r.id),
    candidateName: String(r.candidate_name),
    candidateEmail: String(r.candidate_email),
    candidateRole: String(r.candidate_role),
    yearsExperience: String(r.years_experience),
    fileName: String(r.file_name),
    rawCvText: String(r.raw_cv_text),
    overallScore: Number(r.overall_score),
    gradeTier: String(r.grade_tier),
    isFilteredIn: Boolean(r.is_filtered_in),
    subScores: parse(r.sub_scores_json, {
      skills: 0,
      experience: 0,
      impact: 0,
      education: 0,
    }),
    matchedSkills: parse(r.matched_skills_json, []),
    missingSkills: parse(r.missing_skills_json, []),
    redFlags: parse(r.red_flags_json, []),
    evidenceQuotes: parse(r.evidence_quotes_json, []),
    executiveSummary: String(r.executive_summary),
    recommendationVerdict: String(r.recommendation_verdict),
    interviewQuestions: parse(r.interview_questions_json, []),
    reasoningLog: String(r.reasoning_log || ""),
    rankOrder: Number(r.rank_order),
    fitTier: metadata.fitTier ?? null,
    passedDealbreakers: metadata.passedDealbreakers ?? null,
    dealbreakerAssessments: metadata.dealbreakerAssessments || [],
    evidenceStatus: metadata.evidenceStatus || "legacy",
    actualModel: metadata.actualModel || null,
    gradingMethod: metadata.gradingMethod || "legacy",
  };
}
export async function listRuns(
  db: Database,
  userId: string,
): Promise<EvaluationJob[]> {
  return (
    await db.all<Row>(
      "SELECT * FROM evaluation_jobs WHERE user_id=? ORDER BY created_at DESC LIMIT 50",
      [userId],
    )
  ).map(jobFromRow);
}
export async function loadRun(
  db: Database,
  userId: string,
  id: string,
): Promise<EvaluationRun | null> {
  const row = await db.get<Row>(
    "SELECT * FROM evaluation_jobs WHERE id=? AND user_id=?",
    [id, userId],
  );
  if (!row) return null;
  const candidates = await db.all<Row>(
    "SELECT * FROM candidate_evaluations WHERE job_id=? ORDER BY rank_order",
    [id],
  );
  return {
    job: jobFromRow(row),
    candidates: candidates.map(candidateFromRow),
    failures: parse<EvaluationFailure[]>(row.failures_json, []),
  };
}
export async function saveRun(
  db: Database,
  userId: string,
  run: EvaluationRun,
) {
  const j = run.job;
  const statements: Statement[] = [
    {
      sql: "INSERT INTO evaluation_jobs (id,user_id,title,requirement_text,rubric_weights_json,dealbreakers_json,min_pass_score,provider_used,model_used,effort_used,total_candidates,shortlisted_count,status,created_at,failures_json,prompt_version,request_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      params: [
        j.id,
        userId,
        j.title,
        j.requirementText,
        JSON.stringify(j.rubricWeights),
        JSON.stringify(j.dealbreakers),
        j.minPassScore,
        j.providerUsed,
        j.modelUsed,
        j.effortUsed,
        j.totalCandidates,
        j.shortlistedCount,
        j.status,
        j.createdAt,
        JSON.stringify(run.failures),
        j.promptVersion,
        j.requestId,
      ],
    },
  ];
  for (const c of run.candidates) {
    const fields: Record<string, SqlValue> = {
      id: c.id,
      job_id: j.id,
      candidate_name: c.candidateName,
      candidate_email: c.candidateEmail,
      candidate_role: c.candidateRole,
      years_experience: c.yearsExperience,
      file_name: c.fileName,
      raw_cv_text: c.rawCvText,
      overall_score: c.overallScore,
      grade_tier: c.gradeTier,
      is_filtered_in: c.isFilteredIn ? 1 : 0,
      sub_scores_json: JSON.stringify(c.subScores),
      matched_skills_json: JSON.stringify(c.matchedSkills),
      missing_skills_json: JSON.stringify(c.missingSkills),
      red_flags_json: JSON.stringify(c.redFlags),
      evidence_quotes_json: JSON.stringify(c.evidenceQuotes),
      executive_summary: c.executiveSummary,
      recommendation_verdict: c.recommendationVerdict,
      interview_questions_json: JSON.stringify(c.interviewQuestions),
      reasoning_log: c.reasoningLog,
      rank_order: c.rankOrder,
      created_at: j.createdAt,
      metadata_json: JSON.stringify({
        inputId: c.inputId,
        fitTier: c.fitTier,
        passedDealbreakers: c.passedDealbreakers,
        dealbreakerAssessments: c.dealbreakerAssessments,
        evidenceStatus: c.evidenceStatus,
        actualModel: c.actualModel,
        gradingMethod: c.gradingMethod,
      }),
    };
    statements.push({
      sql:
        "INSERT INTO candidate_evaluations (" +
        Object.keys(fields).join(",") +
        ") VALUES (" +
        Object.keys(fields)
          .map(() => "?")
          .join(",") +
        ")",
      params: Object.values(fields),
    });
  }
  await db.batch(statements);
}
export async function deleteRun(
  db: Database,
  userId: string,
  id: string,
): Promise<boolean> {
  if (
    !(await db.get("SELECT id FROM evaluation_jobs WHERE id=? AND user_id=?", [
      id,
      userId,
    ]))
  )
    return false;
  await db.batch([
    {
      sql: "DELETE FROM candidate_evaluations WHERE job_id IN (SELECT id FROM evaluation_jobs WHERE id=? AND user_id=?)",
      params: [id, userId],
    },
    {
      sql: "DELETE FROM evaluation_jobs WHERE id=? AND user_id=?",
      params: [id, userId],
    },
  ]);
  return true;
}
