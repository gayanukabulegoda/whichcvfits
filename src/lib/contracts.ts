import { z } from "zod";
import type { AIProviderId, ReasoningEffort } from "./llm/catalog.ts";
export const LIMITS = {
  files: 20,
  fileBytes: 5 * 1024 * 1024,
  selectionBytes: 20 * 1024 * 1024,
  pages: 30,
  cvChars: 50000,
  requirementChars: 20000,
};
export const DEFAULT_WEIGHTS = {
  skills: 40,
  experience: 30,
  impact: 20,
  education: 10,
};
export const providerSchema = z.enum(["google", "anthropic", "openai"]);
export const effortSchema = z.enum(["low", "medium", "high"]);
export const weightsSchema = z
  .object({
    skills: z.number().finite().min(0).max(100),
    experience: z.number().finite().min(0).max(100),
    impact: z.number().finite().min(0).max(100),
    education: z.number().finite().min(0).max(100),
  })
  .refine(
    (w) => Object.values(w).some((v) => v > 0),
    "Give at least one scoring area a weight above zero.",
  );
export type RubricWeights = z.infer<typeof weightsSchema>;
export function normalizeWeights(value: RubricWeights): RubricWeights {
  const weights = weightsSchema.parse(value);
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  return Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, (v / sum) * 100]),
  ) as RubricWeights;
}
export const cvSchema = z.object({
  id: z.string().min(1).max(100),
  fileName: z.string().trim().min(1).max(255),
  rawText: z
    .string()
    .trim()
    .min(20, "Add at least 20 characters of readable CV text.")
    .max(LIMITS.cvChars),
});
export type CvInputItem = z.infer<typeof cvSchema>;
export const evaluationSchema = z.object({
  requestId: z.string().uuid(),
  retryOf: z.string().uuid().optional(),
  jobTitle: z.string().trim().min(2).max(200),
  requirementText: z.string().trim().min(15).max(LIMITS.requirementChars),
  provider: providerSchema,
  modelId: z.string().min(1).max(100),
  effort: effortSchema,
  minPassScore: z.number().int().min(0).max(100),
  dealbreakers: z
    .array(z.string().trim().min(1).max(200))
    .max(20)
    .refine(
      (v) => new Set(v.map((s) => s.toLowerCase())).size === v.length,
      "Remove duplicate must-have requirements.",
    ),
  weights: weightsSchema,
  cvs: z
    .array(cvSchema)
    .min(1)
    .max(LIMITS.files)
    .refine(
      (v) => new Set(v.map((c) => c.id)).size === v.length,
      "CV identifiers must be unique.",
    ),
});
export type EvaluationInput = z.infer<typeof evaluationSchema>;
const shortText = z.string().max(2000);
const score = z.number().finite().min(0).max(100);
export const assessmentSchema = z.object({
  requirement: z.string().max(200),
  status: z.enum(["met", "not_met", "unclear"]),
  cvQuote: z.string().max(1500),
  explanation: shortText,
});
export const providerResultSchema = z.object({
  candidateName: z.string().min(1).max(200),
  candidateEmail: z.string().max(320),
  candidateRole: z.string().max(250),
  yearsExperience: z.string().max(100),
  subScores: z.object({
    skills: score,
    experience: score,
    impact: score,
    education: score,
  }),
  matchedSkills: z.array(z.string().min(1).max(100)).max(40),
  missingSkills: z.array(z.string().min(1).max(100)).max(40),
  redFlags: z.array(shortText).max(20),
  evidenceQuotes: z
    .array(
      z.object({
        requirement: z.string().max(200),
        cvQuote: z.string().min(1).max(1500),
        strength: z.enum(["strong", "moderate", "partial"]),
      }),
    )
    .min(1)
    .max(20),
  dealbreakerAssessments: z.array(assessmentSchema).max(20),
  executiveSummary: shortText,
  recommendationVerdict: shortText,
  interviewQuestions: z
    .array(
      z.object({
        question: shortText,
        targetGapOrSkill: shortText,
        whatToLookFor: shortText,
      }),
    )
    .length(3),
  reasoningLog: shortText.describe(
    "A short explanation of scoring criteria and visible CV evidence. Do not provide private reasoning traces.",
  ),
});
export type ProviderResult = z.infer<typeof providerResultSchema>;
export type FitTier =
  | "top_fit"
  | "strong_fit"
  | "partial_fit"
  | "weak_fit"
  | "disqualified";
export const FIT_LABELS: Record<FitTier, string> = {
  top_fit: "Top fit",
  strong_fit: "Strong fit",
  partial_fit: "Partial fit",
  weak_fit: "Weak fit",
  disqualified: "Must-have not evidenced",
};
export interface GradedCandidate extends ProviderResult {
  id: string;
  inputId: string;
  fileName: string;
  rawCvText: string;
  overallScore: number;
  gradeTier: string;
  fitTier: FitTier | null;
  passedDealbreakers: boolean | null;
  isFilteredIn: boolean;
  evidenceStatus: "verified" | "legacy";
  actualModel: string | null;
  gradingMethod: "provider" | "sample" | "legacy";
  rankOrder: number;
}
export interface EvaluationFailure {
  inputId: string;
  fileName: string;
  error: string;
}
export interface SavedKey {
  id: string;
  provider: AIProviderId;
  keyHint: string;
  isValid: boolean;
  availableModels: string[];
}
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  onboardingCompleted: boolean;
  preferredProvider: AIProviderId;
  preferredModel: string;
  preferredEffort: ReasoningEffort;
}
export interface EvaluationJob {
  id: string;
  title: string;
  requirementText: string;
  rubricWeights: RubricWeights;
  dealbreakers: string[];
  minPassScore: number;
  providerUsed: AIProviderId;
  modelUsed: string;
  effortUsed: ReasoningEffort;
  totalCandidates: number;
  shortlistedCount: number;
  status: "completed" | "partial" | "failed";
  createdAt: string;
  promptVersion: string | null;
  requestId: string | null;
}
export interface EvaluationRun {
  job: EvaluationJob;
  candidates: GradedCandidate[];
  failures: EvaluationFailure[];
}
