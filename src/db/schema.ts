import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
  uniqueIndex,
  unique,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  onboardingCompleted: integer("onboarding_completed", { mode: "boolean" })
    .notNull()
    .default(false),
  preferredProvider: text("preferred_provider").notNull().default("google"),
  preferredModel: text("preferred_model").notNull().default("gemini-3.8-flash"),
  preferredEffort: text("preferred_effort").notNull().default("high"),
  themePalette: text("theme_palette").notNull().default("frontier"),
  createdAt: text("created_at").notNull(),
});

export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // 'google' | 'anthropic' | 'openai'
    encryptedKey: text("encrypted_key").notNull(),
    iv: text("iv").notNull(),
    keyHint: text("key_hint").notNull(),
    isValid: integer("is_valid", { mode: "boolean" }).notNull().default(true),
    availableModelsJson: text("available_models_json").notNull().default("[]"),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [unique().on(t.userId, t.provider)],
);

export const evaluationJobs = sqliteTable(
  "evaluation_jobs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    requirementText: text("requirement_text").notNull(),
    rubricWeightsJson: text("rubric_weights_json").notNull(),
    dealbreakersJson: text("dealbreakers_json").notNull().default("[]"),
    minPassScore: integer("min_pass_score").notNull().default(70),
    providerUsed: text("provider_used").notNull(),
    modelUsed: text("model_used").notNull(),
    effortUsed: text("effort_used").notNull(),
    totalCandidates: integer("total_candidates").notNull().default(0),
    shortlistedCount: integer("shortlisted_count").notNull().default(0),
    status: text("status").notNull().default("completed"),
    failuresJson: text("failures_json").notNull().default("[]"),
    promptVersion: text("prompt_version"),
    requestId: text("request_id"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("evaluation_request").on(t.userId, t.requestId),
    index("evaluation_history").on(t.userId, t.createdAt),
  ],
);

export const candidateEvaluations = sqliteTable(
  "candidate_evaluations",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => evaluationJobs.id, { onDelete: "cascade" }),
    candidateName: text("candidate_name").notNull(),
    candidateEmail: text("candidate_email").notNull().default(""),
    candidateRole: text("candidate_role").notNull().default(""),
    yearsExperience: text("years_experience").notNull().default(""),
    fileName: text("file_name").notNull(),
    rawCvText: text("raw_cv_text").notNull(),
    overallScore: integer("overall_score").notNull(),
    gradeTier: text("grade_tier").notNull(), // 'A+' | 'A' | 'B' | 'C' | 'D'
    isFilteredIn: integer("is_filtered_in", { mode: "boolean" }).notNull(),
    subScoresJson: text("sub_scores_json").notNull(), // { skills, experience, impact, education }
    matchedSkillsJson: text("matched_skills_json").notNull(),
    missingSkillsJson: text("missing_skills_json").notNull(),
    redFlagsJson: text("red_flags_json").notNull(),
    evidenceQuotesJson: text("evidence_quotes_json").notNull(),
    executiveSummary: text("executive_summary").notNull(),
    recommendationVerdict: text("recommendation_verdict").notNull(),
    interviewQuestionsJson: text("interview_questions_json").notNull(),
    reasoningLog: text("reasoning_log").notNull().default(""),
    rankOrder: integer("rank_order").notNull(),
    metadataJson: text("metadata_json"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("candidate_job").on(t.jobId, t.rankOrder)],
);

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    bucket: text("bucket").primaryKey(),
    hits: integer("hits").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (t) => [index("rate_limits_expiry").on(t.expiresAt)],
);

export const evaluationRequests = sqliteTable(
  "evaluation_requests",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestId: text("request_id").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.requestId] })],
);
