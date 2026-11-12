"use client";
import { useState } from "react";
import { ArrowDownWideNarrow, Check, Quote, RotateCcw } from "lucide-react";
import NeumorphicGauge from "./NeumorphicGauge";
const examples = [
  {
    name: "Elena Rostova",
    initials: "ER",
    role: "Senior full-stack engineer",
    tone: "blue",
    score: 83,
    skills: ["TypeScript", "Python", "LLM integration"],
    quote:
      "Developed customer-facing web applications using Next.js, React, TypeScript, Tailwind CSS, and Node.js. Integrated Python APIs and LLM-powered search.",
    summary:
      "Strong alignment with the core stack. Explore infrastructure experience in the interview.",
    tier: "Strong fit",
  },
  {
    name: "Alex Rivera",
    initials: "AR",
    role: "Principal AI engineer",
    tone: "green",
    score: 94,
    skills: ["TypeScript", "Python", "RAG"],
    quote:
      "Architected a multi-tenant RAG & document evaluation platform using Next.js 15, React, TypeScript, Python, and FastAPI serving 120,000+ daily users.",
    summary:
      "Clear evidence of the required stack and production delivery. A useful starting point for a technical conversation.",
    tier: "Top fit",
  },
  {
    name: "Marcus Vance",
    initials: "MV",
    role: "Senior backend engineer",
    tone: "blue",
    score: 45,
    skills: ["Python", "PostgreSQL", "AWS"],
    quote:
      "Strictly backend focused; no production experience with React, Next.js, or TypeScript frontend frameworks.",
    summary:
      "Strong backend background, but the mandatory frontend requirement is not evidenced.",
    tier: "Must-have not met",
  },
];
export default function SampleDemo() {
  const [ranked, setRanked] = useState(false);
  const [selected, setSelected] = useState(examples[1]);
  const list = ranked
    ? [...examples].sort((a, b) => b.score - a.score)
    : examples;
  return (
    <section
      className="nm-raised card sample-console"
      id="sample-preview"
      aria-label="Illustrative CV comparison"
    >
      <div className="row between wrap sample-header">
        <span className="sample-title">
          <span className="console-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          A shortlist, with context
        </span>
        <span className="badge badge-blue">Sample only</span>
      </div>
      <div className="nm-inset sample-role">
        <span className="eyebrow">Example role</span>
        <h2>Senior full-stack AI engineer</h2>
        <p>Must-haves: TypeScript, Python, LLM experience</p>
      </div>
      <div className="sample-toolbar">
        <div>
          <strong>Three fictional CVs</strong>
          <p>Select a profile to explore its assessment.</p>
        </div>
        <button
          className={ranked ? "nm-btn" : "nm-btn-primary"}
          onClick={() => setRanked(!ranked)}
        >
          {ranked ? <RotateCcw size={17} /> : <ArrowDownWideNarrow size={17} />}
          {ranked ? "Reset the example" : "Rank the sample CVs"}
        </button>
      </div>
      <p className="sample-status" role="status">
        {ranked
          ? "Ordered by preset match score, highest first."
          : "Original order. Scores are preset for this example."}
      </p>
      <div className="sample-workbench">
        <section
          className="sample-queue"
          aria-labelledby="sample-candidates-heading"
        >
          <div className="sample-section-heading">
            <h3 id="sample-candidates-heading">Candidates</h3>
            <span className="muted text-xs">3 profiles</span>
          </div>
          <div className="sample-list">
            {list.map((c, index) => (
              <button
                className="sample-candidate"
                key={c.name}
                aria-pressed={selected.name === c.name}
                aria-controls="sample-evidence"
                onClick={() => setSelected(c)}
              >
                <span className={"avatar tone-" + c.tone}>
                  {ranked ? "#" + (index + 1) : c.initials}
                </span>
                <span className="sample-choice-meta">
                  <span className="sample-choice-name">{c.name}</span>
                  <span className="sample-choice-role">{c.role}</span>
                </span>
                <span
                  className={
                    "sample-action " +
                    (ranked
                      ? c.score >= 85
                        ? "ink-green"
                        : c.score >= 70
                          ? "ink-blue"
                          : "text-rose-700"
                      : "muted")
                  }
                >
                  {ranked ? c.score : "View"}
                </span>
              </button>
            ))}
          </div>
        </section>
        <section
          className="nm-inset sample-evidence"
          id="sample-evidence"
          aria-labelledby="sample-candidate-heading"
        >
          <div className="sample-section-heading">
            <span className="eyebrow">Example assessment</span>
            <span
              className={
                "badge " +
                (selected.score >= 85
                  ? "badge-green"
                  : selected.score >= 70
                    ? "badge-blue"
                    : "badge-rose")
              }
            >
              {selected.tier}
            </span>
          </div>
          <div className="row between sample-result-heading">
            <div className="min-w-0">
              <h3 id="sample-candidate-heading">{selected.name}</h3>
              <p className="muted">{selected.role}</p>
            </div>
            <div className="sample-score">
              <NeumorphicGauge score={selected.score} />
              <span>match score</span>
            </div>
          </div>
          <p className="sample-summary">{selected.summary}</p>
          <div className="sample-excerpt">
            <h4>Supporting CV excerpt</h4>
            <blockquote>
              <Quote size={15} aria-hidden="true" />
              {selected.quote}
            </blockquote>
          </div>
          <div className="sample-skills">
            <h4>Skills in this example</h4>
            <div className="row wrap gap-2">
              {selected.skills.map((skill) => (
                <span className="chip" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>
        <aside className="nm-inset sample-rule">
          <strong>Must-haves come first.</strong>
          <p>
            A required skill without supporting evidence prevents shortlisting
            and caps the match score at 45.
          </p>
        </aside>
      </div>
      <p className="sample-disclaimer">
        <Check size={14} aria-hidden="true" />
        Preset examples only. No account, uploads, or AI calls.
      </p>
    </section>
  );
}
