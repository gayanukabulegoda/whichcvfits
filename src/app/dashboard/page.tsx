"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Upload,
  FileText,
  Plus,
  Trash2,
  Eye,
  Search,
  Download,
  Columns2,
  SlidersHorizontal,
  Trophy,
  Check,
  History,
  X,
  Files,
  RotateCcw,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  AI_PROVIDERS,
  availableModels,
  getModelById,
  type AIProviderId,
  type ReasoningEffort,
} from "@/lib/llm/catalog";
import {
  DEFAULT_WEIGHTS,
  LIMITS,
  evaluationSchema,
  FIT_LABELS,
  type CvInputItem,
  type GradedCandidate,
  type EvaluationRun,
  type RubricWeights,
} from "@/lib/contracts";
import { SAMPLE_JOB_TEMPLATES, SAMPLE_CANDIDATE_CVS } from "@/lib/sample-data";
import { request, post, errorMessage } from "@/lib/client";
import { validateCvText } from "@/lib/parsers/cv-parser";
import { candidatesCsv } from "@/lib/csv";
import ModelControls from "@/components/ModelControls";
import Dialog from "@/components/Dialog";
import Notice from "@/components/Notice";
import NeumorphicGauge from "@/components/NeumorphicGauge";
import MobileBottomDock from "@/components/MobileBottomDock";
const CandidateDetails = dynamic(
  () => import("@/components/ResultDialogs").then((m) => m.CandidateDetails),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm muted" role="status">
        Loading candidate evidence…
      </p>
    ),
  },
);
const CompareCandidates = dynamic(
  () => import("@/components/ResultDialogs").then((m) => m.CompareCandidates),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm muted" role="status">
        Loading comparison…
      </p>
    ),
  },
);
type Section = "job" | "cvs" | "results";
type QueueItem = CvInputItem & { fingerprint: string; sample?: boolean };
export default function DashboardPage() {
  const { user, keys } = useWorkspace();
  const [section, setSection] = useState<Section>("job");
  const [title, setTitle] = useState("");
  const [requirements, setRequirements] = useState("");
  const [mandatory, setMandatory] = useState("");
  const [weights, setWeights] = useState<RubricWeights>({ ...DEFAULT_WEIGHTS });
  const [cutoff, setCutoff] = useState(70);
  const [provider, setProvider] = useState(user.preferredProvider);
  const [modelId, setModelId] = useState(user.preferredModel);
  const [effort, setEffort] = useState(user.preferredEffort);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState("");
  const [reports, setReports] = useState<
    Array<{ name: string; error: string }>
  >([]);
  const [editor, setEditor] = useState<{
    id: string | null;
    name: string;
    text: string;
  } | null>(null);
  const [editorError, setEditorError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [run, setRun] = useState<EvaluationRun | null>(null);
  const [loadingRun, setLoadingRun] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [inspecting, setInspecting] = useState<GradedCandidate | null>(null);
  const [comparing, setComparing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pending = useRef<{ signature: string; id: string } | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const inFlight = useRef(false);
  const uploadInFlight = useRef(false);
  const key = keys.find((k) => k.provider === provider && k.isValid);
  const models = availableModels(provider, key?.availableModels);
  const jobReady = title.trim().length >= 2 && requirements.trim().length >= 15;
  const ready =
    [true, Boolean(key), jobReady, queue.length > 0].filter(Boolean).length *
    25;
  const reason = !key
    ? "Connect an AI key in Settings."
    : !models.some((m) => m.id === modelId)
      ? "Choose an available model."
      : !jobReady
        ? "Add a role title and job description."
        : !queue.length
          ? "Add at least one readable CV."
          : uploading
            ? "Wait for the files to finish reading."
            : "";
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("job");
    if (!id) return;
    setLoadingRun(true);
    request<EvaluationRun>("/api/evaluate?jobId=" + encodeURIComponent(id))
      .then((data) => {
        setRun(data);
        setSection("results");
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoadingRun(false));
  }, []);
  function controls(p: AIProviderId, m: string, e: ReasoningEffort) {
    setProvider(p);
    setModelId(m);
    setEffort(e);
  }
  function chooseSection(next: Section) {
    setSection(next);
  }
  function sampleJob(id: string) {
    const sample = SAMPLE_JOB_TEMPLATES.find((j) => j.id === id);
    if (!sample) return;
    setTitle(sample.title);
    setRequirements(sample.requirementText);
    setMandatory(sample.dealbreakers.join("\n"));
    setWeights({ ...sample.weights });
    setCutoff(70);
    setError("");
  }
  function sampleCVs() {
    const newItems = SAMPLE_CANDIDATE_CVS.filter(
      (c) => !queue.some((q) => q.fingerprint === "sample-" + c.fileName),
    );
    if (queue.length + newItems.length > LIMITS.files) {
      setError(
        "The queue can hold up to 20 CVs. Remove a few before adding samples.",
      );
      return;
    }
    setQueue((prev) => [
      ...prev,
      ...newItems.map((c) => ({
        ...c,
        id: crypto.randomUUID(),
        fingerprint: "sample-" + c.fileName,
        sample: true,
      })),
    ]);
    setSection("cvs");
    setError("");
  }
  async function upload(files: FileList | null) {
    if (!files?.length || uploadInFlight.current) return;
    if (files.length + queue.length > LIMITS.files) {
      setError("Keep the queue to 20 CVs or fewer.");
      return;
    }
    if (
      Array.from(files).reduce((n, f) => n + f.size, 0) > LIMITS.selectionBytes
    ) {
      setError("Keep each file selection below 20 MiB.");
      return;
    }
    uploadInFlight.current = true;
    setUploading(true);
    setReports([]);
    setError("");
    const additions: QueueItem[] = [];
    const failures: Array<{ name: string; error: string }> = [];
    try {
      const { parseBrowserFile } = await import("@/lib/parsers/browser");
      for (const [index, file] of Array.from(files).entries()) {
        setUploadLabel(
          "Reading " + (index + 1) + " of " + files.length + " · " + file.name,
        );
        try {
          const parsed = await parseBrowserFile(file);
          if (
            [...queue, ...additions].some(
              (q) => q.fingerprint === parsed.fingerprint,
            )
          )
            throw new Error("Already in the queue. Duplicate skipped.");
          additions.push({
            id: crypto.randomUUID(),
            fileName: file.name,
            ...parsed,
          });
        } catch (e) {
          failures.push({ name: file.name, error: errorMessage(e) });
        }
      }
      setQueue((prev) => [...prev, ...additions]);
      setReports(failures);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setUploading(false);
      uploadInFlight.current = false;
      setUploadLabel("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  function saveEditor(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    setEditorError("");
    try {
      const text = validateCvText(editor.text);
      const name = editor.name.trim();
      if (!name) throw new Error("Give this CV a name.");
      if (queue.some((q) => q.id !== editor.id && q.rawText.trim() === text))
        throw new Error("This CV text is already in the queue.");
      if (editor.id)
        setQueue((prev) =>
          prev.map((q) =>
            q.id === editor.id ? { ...q, fileName: name, rawText: text } : q,
          ),
        );
      else {
        if (queue.length >= LIMITS.files)
          throw new Error("The queue already has 20 CVs.");
        setQueue((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            fileName: name,
            rawText: text,
            fingerprint: "paste-" + crypto.randomUUID(),
          },
        ]);
      }
      setEditor(null);
    } catch (e) {
      setEditorError(errorMessage(e));
    }
  }
  async function evaluate(retry = false) {
    if (inFlight.current) return;
    const cvs =
      retry && run
        ? queue.filter((c) => run.failures.some((f) => f.inputId === c.id))
        : queue;
    if (retry && run && !cvs.length) {
      setError(
        "Re-add the failed CVs to retry them. Their text is no longer in this browser queue.",
      );
      return;
    }
    const snapshot =
      retry && run
        ? {
            jobTitle: run.job.title,
            requirementText: run.job.requirementText,
            weights: run.job.rubricWeights,
            dealbreakers: run.job.dealbreakers,
            minPassScore: run.job.minPassScore,
            provider: run.job.providerUsed,
            modelId: run.job.modelUsed,
            effort: run.job.effortUsed,
          }
        : {
            jobTitle: title,
            requirementText: requirements,
            weights,
            dealbreakers: mandatory
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
            minPassScore: cutoff,
            provider,
            modelId,
            effort,
          };
    const payload = {
      ...snapshot,
      cvs: cvs.map(({ id, fileName, rawText }) => ({ id, fileName, rawText })),
      ...(retry && run ? { retryOf: run.job.id } : {}),
    };
    const signature = JSON.stringify(payload);
    if (pending.current?.signature !== signature)
      pending.current = { signature, id: crypto.randomUUID() };
    const parsed = evaluationSchema.safeParse({
      ...payload,
      requestId: pending.current.id,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await post<EvaluationRun>("/api/evaluate", {
        ...parsed.data,
        ...(retry && run ? { retryOf: run.job.id } : {}),
      });
      setRun(data);
      pending.current = null;
      setFilter("all");
      setQuery("");
      setSkill(null);
      setSelected([]);
      setSection("results");
      requestAnimationFrame(() =>
        resultsRef.current?.scrollIntoView({
          block: "start",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        }),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  function exportCsv() {
    if (!run) return;
    const blob = new Blob([candidatesCsv(run.candidates)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      run.job.title.replace(/[^a-z0-9_-]/gi, "_").slice(0, 100) +
      "_WhichCVFits.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const results = run?.candidates || [];
  const displayed = results.filter(
    (c) =>
      (filter === "all" ||
        (filter === "shortlisted" && c.isFilteredIn) ||
        (filter === "review" && !c.isFilteredIn)) &&
      (!query.trim() ||
        (
          c.candidateName +
          " " +
          c.candidateRole +
          " " +
          c.matchedSkills.join(" ")
        )
          .toLowerCase()
          .includes(query.trim().toLowerCase())) &&
      (!skill || c.matchedSkills.includes(skill)),
  );
  const skills = Array.from(
    new Set(results.flatMap((c) => c.matchedSkills)),
  ).slice(0, 12);
  const weightTotal = Object.values(weights).reduce((sum, v) => sum + v, 0);
  return (
    <main id="main-content" className="container workspace-main studio-main">
      <div className="page-heading studio-heading">
        <div>
          <span className="eyebrow">Your evaluation studio</span>
          <h1>Make your next shortlist clearer.</h1>
          <p>Start with the role. Add CVs. Review the evidence.</p>
        </div>
        <div className="readiness">
          <span className="font-semibold">{ready}% ready</span>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Evaluation readiness"
            aria-valuenow={ready}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: ready + "%" }} />
          </div>
          <span className="text-xs muted">
            {ready === 100 ? "Ready to evaluate" : "Account + key + job + CVs"}
          </span>
        </div>
      </div>
      {error && (
        <div className="mb-5">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <div
        className="mobile-steps segmented nm-inset"
        role="tablist"
        aria-label="Evaluation steps"
      >
        {(["job", "cvs", "results"] as Section[]).map((s, i) => (
          <button
            id={"tab-" + s}
            key={s}
            role="tab"
            aria-selected={section === s}
            aria-controls={"panel-" + s}
            tabIndex={section === s ? 0 : -1}
            onClick={() => chooseSection(s)}
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const tabs: Section[] = ["job", "cvs", "results"];
                const index =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? 2
                      : (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                setSection(tabs[index]);
                document.getElementById("tab-" + tabs[index])?.focus();
              }
            }}
          >
            {i + 1}.{" "}
            {s === "job"
              ? "Job"
              : s === "cvs"
                ? "CVs (" + queue.length + ")"
                : "Results"}
          </button>
        ))}
      </div>
      <div className="workspace-grid">
        <div className="workspace-config">
          <section
            id="panel-job"
            className={
              "nm-raised card stack config-panel tone-blue " +
              (section !== "job" ? "mobile-hidden" : "")
            }
            aria-labelledby="job-heading"
          >
            <div className="card-title mb-0">
              <span className="number nm-inset">1</span>
              <div>
                <h2 id="job-heading" className="text-lg">
                  Define the role
                </h2>
                <p>Tell us what a good fit looks like.</p>
              </div>
            </div>
            <fieldset disabled={busy} className="stack min-w-0">
              <div className="field">
                <label htmlFor="template">Start from a sample</label>
                <select
                  id="template"
                  className="nm-input"
                  defaultValue=""
                  onChange={(e) => sampleJob(e.target.value)}
                >
                  <option value="" disabled>
                    Choose a template, or write your own
                  </option>
                  {SAMPLE_JOB_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="job-title">Role title</label>
                <input
                  id="job-title"
                  className="nm-input"
                  placeholder="e.g. Senior product designer"
                  value={title}
                  maxLength={200}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="requirements">Job description</label>
                <textarea
                  id="requirements"
                  className="nm-input text-sm leading-relaxed"
                  rows={5}
                  placeholder="Paste the responsibilities, required experience, and skills for this role."
                  value={requirements}
                  maxLength={LIMITS.requirementChars}
                  onChange={(e) => setRequirements(e.target.value)}
                />
                <small>
                  Use job-related criteria. More specific requirements make
                  results easier to review.
                </small>
              </div>
              <div className="field">
                <label htmlFor="mandatory">
                  Must-have requirements{" "}
                  <span className="muted font-normal">· optional</span>
                </label>
                <textarea
                  id="mandatory"
                  className="nm-input text-sm"
                  rows={2}
                  placeholder={
                    "One requirement per line, e.g.\nProduction TypeScript experience"
                  }
                  value={mandatory}
                  maxLength={4000}
                  onChange={(e) => setMandatory(e.target.value)}
                />
                <small>
                  If a must-have is not evidenced, the candidate cannot be
                  shortlisted and the score is capped at 45.
                </small>
              </div>
              <details className="nm-inset p-4">
                <summary className="text-sm">
                  <span className="row">
                    <SlidersHorizontal size={16} />
                    Scoring preferences
                  </span>
                </summary>
                <div className="stack">
                  <div className="field">
                    <label htmlFor="threshold" className="row between">
                      <span>Shortlist threshold</span>
                      <strong>{cutoff}/100</strong>
                    </label>
                    <input
                      id="threshold"
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={cutoff}
                      onChange={(e) => setCutoff(Number(e.target.value))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries({
                      skills: "Hard skills",
                      experience: "Experience",
                      impact: "Domain & impact",
                      education: "Qualifications",
                    }).map(([k, label]) => (
                      <div className="field" key={k}>
                        <label htmlFor={"weight-" + k}>{label}</label>
                        <input
                          id={"weight-" + k}
                          className="nm-input"
                          type="number"
                          min={0}
                          max={100}
                          value={weights[k as keyof RubricWeights]}
                          onChange={(e) =>
                            setWeights((w) => ({
                              ...w,
                              [k]: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs muted">
                    {weightTotal === 100
                      ? "Weights total 100%."
                      : weightTotal
                        ? "Weights total " +
                          weightTotal +
                          "; they will be normalized to 100%."
                        : "Set at least one weight above zero."}
                  </p>
                </div>
              </details>
            </fieldset>
            <button
              className="nm-btn md:hidden"
              onClick={() => setSection("cvs")}
            >
              Next: add CVs <ArrowRight size={16} />
            </button>
          </section>
          <section
            id="panel-cvs"
            className={
              "nm-raised card stack config-panel tone-green " +
              (section !== "cvs" ? "mobile-hidden" : "")
            }
            aria-labelledby="cv-heading"
          >
            <div className="card-title mb-0">
              <span className="number nm-inset">2</span>
              <div>
                <h2 id="cv-heading" className="text-lg">
                  Add candidate CVs
                </h2>
                <p>Files are read locally on your device.</p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md"
              className="sr-only"
              tabIndex={-1}
              aria-label="Choose CV files"
              onChange={(e) => void upload(e.target.files)}
              disabled={busy || uploading}
            />
            <button
              type="button"
              className="upload-area nm-inset"
              disabled={busy || uploading}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!busy && !uploading) void upload(e.dataTransfer.files);
              }}
            >
              <Upload size={25} className="text-emerald-700" />
              <strong className="text-sm">
                {uploading
                  ? "Reading your files…"
                  : "Choose files or drop them here"}
              </strong>
              <span className="text-xs muted">
                PDF, DOCX, TXT, MD · up to 5 MiB each
              </span>
              <span className="text-xs muted">
                20 CVs per queue · 20 MiB per selection
              </span>
            </button>
            {uploading && (
              <p role="status" className="text-xs muted break-words">
                {uploadLabel}
              </p>
            )}
            <div className="row wrap gap-2">
              <button
                className="nm-btn flex-1"
                disabled={busy || uploading}
                onClick={() => {
                  setEditorError("");
                  setEditor({ id: null, name: "Pasted CV.txt", text: "" });
                }}
              >
                <Plus size={16} />
                Paste text
              </button>
              <button
                className="nm-btn flex-1"
                disabled={busy || uploading}
                onClick={sampleCVs}
              >
                <Files size={16} />5 sample CVs
              </button>
            </div>
            {reports.length > 0 && (
              <div className="stack gap-2">
                {reports.map((r, i) => (
                  <Notice tone="warning" key={i}>
                    <strong className="break-all">{r.name}</strong>
                    <p>{r.error}</p>
                  </Notice>
                ))}
              </div>
            )}
            <div className="stack gap-2">
              {queue.map((c) => (
                <div className="queue-row" key={c.id}>
                  <FileText size={18} className="text-emerald-700" />
                  <div className="min-w-0 flex-1">
                    <p className="queue-name" title={c.fileName}>
                      {c.fileName}
                    </p>
                    <p className="text-xs muted">
                      {c.rawText.length.toLocaleString()} characters
                      {c.sample ? " · sample" : ""}
                    </p>
                  </div>
                  <button
                    className="nm-btn icon-btn"
                    aria-label={"Review " + c.fileName}
                    disabled={busy || uploading}
                    onClick={() => {
                      setEditorError("");
                      setEditor({
                        id: c.id,
                        name: c.fileName,
                        text: c.rawText,
                      });
                    }}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="nm-btn icon-btn"
                    aria-label={"Remove " + c.fileName}
                    disabled={busy || uploading}
                    onClick={() =>
                      setQueue((prev) => prev.filter((q) => q.id !== c.id))
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            {queue.length > 0 && (
              <p className="text-xs muted">
                {queue.length} of 20 CVs ready. Review any file to edit its
                extracted text. CVs in this queue stay in memory until
                evaluated.
              </p>
            )}
            <div className="divider stack">
              <h3 className="text-sm">Choose your AI</h3>
              <ModelControls
                keys={keys}
                provider={provider}
                modelId={modelId}
                effort={effort}
                onChange={controls}
                disabled={busy}
              />
              {!key && (
                <Notice tone="warning">
                  Connect a {AI_PROVIDERS[provider].shortName} API key to
                  evaluate.{" "}
                  <Link className="text-link" href="/settings">
                    Open Settings
                  </Link>
                </Notice>
              )}
              <p className="text-xs muted">
                Running an evaluation sends CV text to your selected provider
                and saves the results to your account.{" "}
                <Link href="/privacy" className="text-link">
                  How data is handled
                </Link>
              </p>
              <button
                className="nm-btn-primary desktop-evaluate"
                disabled={busy || Boolean(reason) || weightTotal <= 0}
                onClick={() => void evaluate()}
              >
                <ArrowRight size={17} />
                {busy
                  ? "Evaluating CVs…"
                  : "Evaluate " +
                    queue.length +
                    " CV" +
                    (queue.length === 1 ? "" : "s")}
              </button>
              {busy && (
                <p className="text-xs muted" role="status">
                  Waiting for the provider. Requests run in groups of up to
                  three. This can take a few minutes.
                </p>
              )}
              {reason && (
                <p className="text-xs muted desktop-evaluate">{reason}</p>
              )}
            </div>
          </section>
        </div>
        <section
          ref={resultsRef}
          id="panel-results"
          aria-labelledby="results-heading"
          className={
            "results-column stack " +
            (section !== "results" ? "mobile-hidden" : "")
          }
        >
          <div className="nm-flat card stack results-header">
            <div className="row between wrap">
              <div className="row">
                <span className="icon-tile tone-blue">
                  <Trophy size={21} />
                </span>
                <h2 id="results-heading">Your shortlist</h2>
              </div>
              <Link
                href="/settings#history"
                className="text-link text-xs row py-2"
              >
                <History size={14} />
                Saved runs
              </Link>
            </div>
            {run && (
              <div className="text-xs muted">
                <p className="font-semibold text-sm text-slate-800 break-words">
                  {run.job.title}
                </p>
                <p className="mt-2 break-words">
                  {AI_PROVIDERS[run.job.providerUsed]?.shortName ||
                    run.job.providerUsed}{" "}
                  · {run.job.modelUsed} ·{" "}
                  {getModelById(run.job.modelUsed)?.thinking === "none"
                    ? "standard"
                    : run.job.effortUsed + " effort"}
                </p>
                <p className="mt-1">
                  {run.job.totalCandidates} CVs · {run.job.shortlistedCount}{" "}
                  shortlisted · threshold {run.job.minPassScore}/100
                </p>
                <details className="nm-inset p-4 mt-4">
                  <summary>Criteria used for this run</summary>
                  <div className="stack gap-3">
                    <p className="whitespace-pre-wrap text-sm">
                      {run.job.requirementText}
                    </p>
                    <p>
                      <strong>Must-haves:</strong>{" "}
                      {run.job.dealbreakers.join("; ") || "None specified"}
                    </p>
                    <p>
                      <strong>Weights:</strong> Hard skills{" "}
                      {Math.round(run.job.rubricWeights.skills)}% · Experience{" "}
                      {Math.round(run.job.rubricWeights.experience)}% · Domain &
                      impact {Math.round(run.job.rubricWeights.impact)}% ·
                      Qualifications{" "}
                      {Math.round(run.job.rubricWeights.education)}%
                    </p>
                    <button
                      type="button"
                      className="nm-btn self-start"
                      disabled={busy}
                      onClick={() => {
                        setTitle(run.job.title);
                        setRequirements(run.job.requirementText);
                        setMandatory(run.job.dealbreakers.join("\n"));
                        setWeights({ ...run.job.rubricWeights });
                        setCutoff(run.job.minPassScore);
                        setProvider(run.job.providerUsed);
                        setModelId(run.job.modelUsed);
                        setEffort(run.job.effortUsed);
                        setSection("job");
                        window.scrollTo({
                          top: 0,
                          behavior: matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches
                            ? "auto"
                            : "smooth",
                        });
                      }}
                    >
                      Use criteria for a new review
                    </button>
                  </div>
                </details>
              </div>
            )}
            {!run && (
              <p className="muted text-sm">
                Ranked results will appear here after your first evaluation.
              </p>
            )}
          </div>
          {loadingRun ? (
            <div className="nm-inset card" role="status">
              Opening saved evaluation…
            </div>
          ) : !run ? (
            <div className="nm-inset empty-state">
              <span className="empty-orb tone-blue">
                <ScanIcon />
              </span>
              <h3>Good decisions start with clear criteria.</h3>
              <p>
                Add the role and candidate CVs, then evaluate when you’re ready.
                Each match comes with evidence you can review.
              </p>
              <button
                className="nm-btn md:hidden"
                onClick={() => setSection(!jobReady ? "job" : "cvs")}
              >
                {!jobReady ? "Define your role" : "Add candidate CVs"}
                <ArrowRight size={16} />
              </button>
              <a href="/#sample-demo" className="text-link text-sm">
                See a sample result
              </a>
            </div>
          ) : (
            <>
              {run.failures.length > 0 && (
                <Notice tone="warning">
                  <p className="font-semibold">
                    {run.failures.length} CV
                    {run.failures.length === 1 ? " needs" : "s need"} another
                    look
                  </p>
                  <ul className="mt-2 space-y-2 text-xs">
                    {run.failures.map((f) => (
                      <li key={f.inputId}>
                        <strong className="break-all">{f.fileName}</strong> —{" "}
                        {f.error}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="nm-btn mt-3"
                    disabled={busy}
                    onClick={() => void evaluate(true)}
                  >
                    <RotateCcw size={15} />
                    Retry failed CVs only
                  </button>
                </Notice>
              )}
              {results.length > 0 && (
                <>
                  <div className="row wrap gap-2">
                    <button className="nm-btn" onClick={exportCsv}>
                      <Download size={15} />
                      Export CSV
                    </button>
                    <button
                      className="nm-btn"
                      disabled={selected.length < 2}
                      onClick={() => setComparing(true)}
                    >
                      <Columns2 size={15} />
                      Compare ({selected.length}/3)
                    </button>
                  </div>
                  <div
                    className="nm-inset segmented"
                    role="group"
                    aria-label="Filter candidate results"
                  >
                    {[
                      ["all", "All (" + results.length + ")"],
                      [
                        "shortlisted",
                        "Shortlist (" +
                          results.filter((c) => c.isFilteredIn).length +
                          ")",
                      ],
                      [
                        "review",
                        "Review (" +
                          results.filter((c) => !c.isFilteredIn).length +
                          ")",
                      ],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        aria-pressed={filter === value}
                        onClick={() => setFilter(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="field">
                    <label htmlFor="candidate-search" className="sr-only">
                      Search candidate results
                    </label>
                    <div className="relative">
                      <Search
                        size={18}
                        className="absolute left-4 top-4 text-slate-500"
                      />
                      <input
                        id="candidate-search"
                        className="nm-input pl-11"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Find a name, role, or matched skill"
                      />
                    </div>
                  </div>
                  {skills.length > 0 && (
                    <details>
                      <summary className="text-xs">
                        Spotlight a matched skill{skill ? ": " + skill : ""}
                      </summary>
                      <div className="row wrap gap-2">
                        {skills.map((s) => (
                          <button
                            key={s}
                            className="chip"
                            aria-pressed={skill === s}
                            onClick={() => setSkill(skill === s ? null : s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </details>
                  )}
                  {(query || skill || filter !== "all") && (
                    <button
                      className="text-link text-xs self-start py-2"
                      onClick={() => {
                        setQuery("");
                        setSkill(null);
                        setFilter("all");
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                  <p className="text-xs muted" aria-live="polite">
                    {displayed.length} candidate
                    {displayed.length === 1 ? "" : "s"} shown. Select up to
                    three to compare.
                  </p>
                </>
              )}
              <div className="results-grid">
                {displayed.map((c) => (
                  <article
                    className={
                      "nm-flat candidate-card stack gap-3 " +
                      (c.rankOrder === 1 ? "top-candidate" : "")
                    }
                    key={c.id}
                    data-tier={c.fitTier || "legacy"}
                  >
                    <div className="row between items-start">
                      <div className="min-w-0">
                        <div className="row wrap gap-2 mb-3">
                          <span className="badge">#{c.rankOrder}</span>
                          <span
                            className={
                              "badge " +
                              (c.isFilteredIn
                                ? c.fitTier === "strong_fit"
                                  ? "badge-blue"
                                  : "badge-green"
                                : c.fitTier === "disqualified"
                                  ? "badge-rose"
                                  : "badge-amber")
                            }
                          >
                            {c.fitTier
                              ? FIT_LABELS[c.fitTier]
                              : "Legacy result"}
                          </span>
                        </div>
                        <h3>{c.candidateName}</h3>
                        <p className="candidate-meta">{c.candidateRole}</p>
                      </div>
                      <NeumorphicGauge score={c.overallScore} />
                    </div>
                    <p className="candidate-summary mt-0">
                      {c.executiveSummary}
                    </p>
                    <div className="row wrap gap-2">
                      {c.matchedSkills.slice(0, 4).map((s) => (
                        <button
                          className="chip"
                          aria-pressed={skill === s}
                          onClick={() => setSkill(skill === s ? null : s)}
                          key={s}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="candidate-actions row between wrap divider gap-3">
                      <label className="row text-xs cursor-pointer min-h-11">
                        <input
                          type="checkbox"
                          checked={selected.includes(c.id)}
                          disabled={
                            !selected.includes(c.id) && selected.length >= 3
                          }
                          onChange={(e) =>
                            setSelected((prev) =>
                              e.target.checked
                                ? [...prev, c.id]
                                : prev.filter((id) => id !== c.id),
                            )
                          }
                        />
                        Compare
                      </label>
                      <button
                        className="nm-btn"
                        onClick={() => setInspecting(c)}
                      >
                        <Eye size={15} />
                        View evidence
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {results.length > 0 && !displayed.length && (
                <div className="nm-inset card text-center">
                  <p className="text-sm muted">
                    No candidates match these filters.
                  </p>
                  <button
                    className="text-link text-sm mt-3"
                    onClick={() => {
                      setQuery("");
                      setSkill(null);
                      setFilter("all");
                    }}
                  >
                    Show all candidates
                  </button>
                </div>
              )}
              <p className="text-xs muted">
                Match scores summarize CV evidence against the saved rubric.
                They do not verify claims or replace your hiring judgment.
              </p>
            </>
          )}
        </section>
      </div>
      <MobileBottomDock
        disabled={Boolean(reason) || weightTotal <= 0}
        busy={busy}
        onRun={() => void evaluate()}
        reason={reason}
        count={queue.length}
      />
      <Dialog
        open={Boolean(editor)}
        onClose={() => {
          if (!uploading) setEditor(null);
        }}
        title={editor?.id ? "Review CV text" : "Add a CV as text"}
        description="Check the text that will be sent for evaluation. Changes apply to this queue only."
      >
        <form className="stack" onSubmit={saveEditor}>
          <div className="field">
            <label htmlFor="cv-name">CV name</label>
            <input
              id="cv-name"
              className="nm-input"
              value={editor?.name || ""}
              onChange={(e) =>
                setEditor((v) => (v ? { ...v, name: e.target.value } : v))
              }
              required
              maxLength={255}
            />
          </div>
          <div className="field">
            <label htmlFor="cv-text">Complete CV text</label>
            <textarea
              id="cv-text"
              className="nm-input text-sm"
              rows={12}
              value={editor?.text || ""}
              onChange={(e) =>
                setEditor((v) => (v ? { ...v, text: e.target.value } : v))
              }
              required
              minLength={20}
              maxLength={LIMITS.cvChars}
            />
            <small>
              {(editor?.text.length || 0).toLocaleString()} / 50,000 characters
            </small>
          </div>
          {editorError && <Notice tone="error">{editorError}</Notice>}
          <button className="nm-btn-primary" type="submit">
            <Check size={17} />
            {editor?.id ? "Save changes" : "Add to queue"}
          </button>
        </form>
      </Dialog>
      {inspecting && (
        <Dialog
          open
          onClose={() => setInspecting(null)}
          title={inspecting.candidateName}
          description="Review the evidence, then decide your next step."
          wide
        >
          <CandidateDetails candidate={inspecting} />
        </Dialog>
      )}
      {comparing && (
        <Dialog
          open
          onClose={() => setComparing(false)}
          title="Compare candidates"
          description="Compare the same scoring areas, then review each candidate’s evidence."
          wide
        >
          <CompareCandidates
            candidates={results.filter((c) => selected.includes(c.id))}
          />
        </Dialog>
      )}
    </main>
  );
}
function ScanIcon() {
  return <Files size={32} />;
}
