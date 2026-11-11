"use client";
import { useState } from "react";
import { ArrowDownWideNarrow, Check, Quote, RotateCcw } from "lucide-react";
import NeumorphicGauge from "./NeumorphicGauge";
const examples = [
  {
    name: "Elena Rostova",
    initials: "ER",
    role: "Senior full-stack engineer",
    score: 83,
    skills: ["React", "TypeScript", "Python"],
    quote:
      "Developed customer-facing web applications using Next.js, React, TypeScript, Tailwind CSS, and Node.js.",
    summary:
      "Strong alignment with the core stack. Explore infrastructure experience in the interview.",
    tier: "Strong fit",
  },
  {
    name: "Alex Rivera",
    initials: "AR",
    role: "Principal AI engineer",
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
    <div
      className="nm-raised card stack sample-console"
      id="sample-demo"
      style={{ scrollMarginTop: 110 }}
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
        <span className="badge">Sample only</span>
      </div>
      <div className="nm-inset p-4 text-sm sample-role">
        <div className="font-semibold">Senior full-stack AI engineer</div>
        <p className="muted text-xs mt-1">
          Must-haves: TypeScript, Python, LLM experience
        </p>
      </div>
      <div className="stack gap-3 sample-list">
        {list.map((c, i) => (
          <button
            className="sample-candidate"
            key={c.name}
            aria-pressed={selected.name === c.name}
            onClick={() => setSelected(c)}
          >
            <span className={"avatar " + (i % 2 ? "tone-green" : "tone-blue")}>
              {ranked ? "#" + (i + 1) : c.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-semibold text-sm block">{c.name}</span>
              <span className="muted text-xs block">{c.role}</span>
            </span>
            {ranked ? (
              <strong
                className={
                  c.score >= 85
                    ? "ink-green"
                    : c.score >= 70
                      ? "ink-blue"
                      : "text-rose-700"
                }
              >
                {c.score}
              </strong>
            ) : (
              <span className="text-xs muted">View</span>
            )}
          </button>
        ))}
      </div>
      <div className="nm-inset p-4 stack gap-3 sample-evidence">
        <div className="row between">
          <div>
            <p className="text-sm font-semibold">{selected.name}</p>
            <span
              className={
                "badge mt-2 " +
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
          <NeumorphicGauge score={selected.score} size="sm" />
        </div>
        <p className="text-xs muted">{selected.summary}</p>
        <div className="text-xs text-slate-700">
          <Quote size={14} className="inline mr-1 ink-blue" />
          {selected.quote}
        </div>
      </div>
      <button
        className={ranked ? "nm-btn" : "nm-btn-primary"}
        onClick={() => setRanked(!ranked)}
      >
        {ranked ? <RotateCcw size={17} /> : <ArrowDownWideNarrow size={17} />}{" "}
        {ranked ? "Reset the example" : "Rank the sample CVs"}
      </button>
      <p className="text-xs muted text-center">
        <Check size={13} className="inline mr-1" />
        Illustrative results. No account, uploads, or AI calls.
      </p>
    </div>
  );
}
