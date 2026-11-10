"use client";
import type { CSSProperties } from "react";
import type { GradedCandidate } from "@/lib/contracts";
import { FIT_LABELS } from "@/lib/contracts";
import NeumorphicGauge from "./NeumorphicGauge";
import Notice from "./Notice";
const pillars = {
  skills: "Hard skills",
  experience: "Experience",
  impact: "Domain & impact",
  education: "Education & qualifications",
};
export function CandidateDetails({
  candidate,
}: {
  candidate: GradedCandidate | null;
}) {
  if (!candidate) return null;
  const c = candidate;
  return (
    <div className="stack">
      <div className="row between gap-4">
        <div className="min-w-0">
          <span
            className={
              "badge " + (c.isFilteredIn ? "badge-green" : "badge-rose")
            }
          >
            {c.fitTier ? FIT_LABELS[c.fitTier] : "Legacy result"}
          </span>
          <p className="text-sm muted mt-3 break-words">
            {c.candidateRole} · {c.yearsExperience || "Experience not stated"}
          </p>
          <p className="text-xs muted mt-2 break-all">{c.fileName}</p>
        </div>
        <NeumorphicGauge score={c.overallScore} size="lg" />
      </div>
      <p className="text-sm">{c.executiveSummary}</p>
      {c.evidenceStatus === "legacy" && (
        <Notice tone="warning">
          This saved result predates evidence validation. Must-have assessments
          and actual model details are unavailable.
        </Notice>
      )}
      <div className="score-bars">
        {Object.entries(pillars).map(([key, label]) => (
          <div className="text-xs" key={key}>
            <div className="row between">
              <span>{label}</span>
              <strong>
                {c.subScores[key as keyof typeof c.subScores]}/100
              </strong>
            </div>
            <div className="score-bar">
              <span
                style={{
                  width: c.subScores[key as keyof typeof c.subScores] + "%",
                }}
              />
            </div>
          </div>
        ))}
      </div>
      {c.dealbreakerAssessments.length > 0 && (
        <section className="stack gap-3 divider">
          <h3>Must-have requirements</h3>
          {c.dealbreakerAssessments.map((a) => (
            <div className="nm-inset p-4" key={a.requirement}>
              <div className="row between wrap">
                <strong className="text-sm">{a.requirement}</strong>
                <span
                  className={
                    "badge " +
                    (a.status === "met" ? "badge-green" : "badge-rose")
                  }
                >
                  {a.status === "met"
                    ? "Evidenced"
                    : a.status === "not_met"
                      ? "Not met"
                      : "Needs review"}
                </span>
              </div>
              <p className="text-xs muted mt-2">{a.explanation}</p>
              {a.cvQuote && (
                <blockquote className="text-sm mt-3 border-l-2 border-emerald-500 pl-3">
                  {a.cvQuote}
                </blockquote>
              )}
            </div>
          ))}
        </section>
      )}
      <section className="stack gap-3 divider">
        <h3>Supporting CV evidence</h3>
        <p className="text-xs muted">
          {c.evidenceStatus === "verified"
            ? "These quotes were checked against the submitted CV text. They do not independently verify the candidate’s claims."
            : "Quotes from the original saved evaluation."}
        </p>
        {c.evidenceQuotes.map((q, i) => (
          <div key={i}>
            <p className="text-xs font-semibold mb-2">{q.requirement}</p>
            <blockquote className="evidence-quote">{q.cvQuote}</blockquote>
          </div>
        ))}
      </section>
      <div className="grid sm:grid-cols-2 gap-5 divider">
        <section>
          <h3>Matched skills</h3>
          <div className="row wrap mt-3 gap-2">
            {c.matchedSkills.map((s) => (
              <span className="chip" key={s}>
                {s}
              </span>
            ))}
          </div>
        </section>
        <section>
          <h3>Gaps to explore</h3>
          <div className="row wrap mt-3 gap-2">
            {c.missingSkills.map((s) => (
              <span className="chip" key={s}>
                {s}
              </span>
            ))}
          </div>
        </section>
      </div>
      {c.redFlags.length > 0 && (
        <section className="divider">
          <h3>Points to verify</h3>
          <ul className="list-disc pl-5 text-sm muted mt-3 space-y-2">
            {c.redFlags.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="stack gap-3 divider">
        <h3>Questions for your conversation</h3>
        {c.interviewQuestions.map((q, i) => (
          <details className="nm-flat-sm p-4" key={i}>
            <summary className="text-sm">
              {i + 1}. {q.question}
            </summary>
            <p className="text-xs font-semibold text-emerald-800 mb-2">
              {q.targetGapOrSkill}
            </p>
            <p className="text-sm muted">{q.whatToLookFor}</p>
          </details>
        ))}
      </section>
      <details className="nm-inset p-4">
        <summary className="text-sm">Scoring explanation & source text</summary>
        <p className="text-sm muted mb-4">
          {c.reasoningLog || "No explanation was saved."}
        </p>
        <p className="text-xs muted mb-3">
          Actual model: {c.actualModel || "Unavailable for this legacy run"}
        </p>
        <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed max-h-72 overflow-y-auto">
          {c.rawCvText}
        </pre>
      </details>
    </div>
  );
}
export function CompareCandidates({
  candidates,
}: {
  candidates: GradedCandidate[];
}) {
  return (
    <div
      className="comparison-grid"
      style={{ "--compare-count": candidates.length } as CSSProperties}
    >
      {candidates.map((c) => (
        <article className="nm-flat card stack gap-4" key={c.id}>
          <span className="badge self-start">Rank #{c.rankOrder}</span>
          <NeumorphicGauge score={c.overallScore} />
          <div>
            <h3>{c.candidateName}</h3>
            <p className="text-xs muted mt-2">{c.candidateRole}</p>
          </div>
          <span
            className={
              "badge self-start " +
              (c.isFilteredIn ? "badge-green" : "badge-rose")
            }
          >
            {c.fitTier ? FIT_LABELS[c.fitTier] : "Legacy result"}
          </span>
          <div className="stack gap-2 text-xs divider">
            {Object.entries(pillars).map(([key, label]) => (
              <div className="row between" key={key}>
                <span>{label}</span>
                <strong>{c.subScores[key as keyof typeof c.subScores]}</strong>
              </div>
            ))}
          </div>
          <p className="text-xs muted">{c.executiveSummary}</p>
          <div className="text-xs divider">
            <strong>Matched skills</strong>
            <p className="muted mt-2">
              {c.matchedSkills.join(", ") || "None evidenced"}
            </p>
          </div>
          <div className="text-xs">
            <strong>Missing skills</strong>
            <p className="muted mt-2">
              {c.missingSkills.join(", ") || "None listed"}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
