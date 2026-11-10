"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  KeyRound,
  Plus,
  Check,
  Trash2,
  ArrowUpRight,
  History,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  AI_PROVIDERS,
  PROVIDER_IDS,
  type AIProviderId,
  type ReasoningEffort,
} from "@/lib/llm/catalog";
import type { EvaluationJob } from "@/lib/contracts";
import { request, post, errorMessage } from "@/lib/client";
import Dialog from "@/components/Dialog";
import Notice from "@/components/Notice";
import KeyForm from "@/components/KeyForm";
import ModelControls from "@/components/ModelControls";
export default function SettingsPage() {
  const { user, keys, refresh } = useWorkspace();
  const [connecting, setConnecting] = useState<AIProviderId | null>(null);
  const [deleting, setDeleting] = useState<{
    kind: "key" | "run";
    id: string;
    name: string;
  } | null>(null);
  const [provider, setProvider] = useState(user.preferredProvider);
  const [modelId, setModelId] = useState(user.preferredModel);
  const [effort, setEffort] = useState(user.preferredEffort);
  const [jobs, setJobs] = useState<EvaluationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function loadHistory() {
    const data = await request<{ jobs: EvaluationJob[] }>("/api/evaluate");
    setJobs(data.jobs);
  }
  useEffect(() => {
    loadHistory()
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    setProvider(user.preferredProvider);
    setModelId(user.preferredModel);
    setEffort(user.preferredEffort);
  }, [user.preferredProvider, user.preferredModel, user.preferredEffort]);
  function change(p: AIProviderId, m: string, e: ReasoningEffort) {
    setProvider(p);
    setModelId(m);
    setEffort(e);
  }
  async function saveDefaults() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await post("/api/auth", {
        action: "update_preferences",
        preferredProvider: provider,
        preferredModel: modelId,
        preferredEffort: effort,
      });
      await refresh();
      setMessage("Your evaluation defaults have been saved.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (deleting.kind === "key") {
        await request("/api/keys?provider=" + deleting.id, {
          method: "DELETE",
        });
        await refresh();
      } else {
        await request(
          "/api/evaluate?jobId=" + encodeURIComponent(deleting.id),
          { method: "DELETE" },
        );
        await loadHistory();
      }
      setMessage(
        deleting.kind === "key"
          ? "The API key was removed."
          : "The saved evaluation and its candidate text were deleted.",
      );
      setDeleting(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main-content" className="container workspace-main settings-width">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Make the workspace yours</span>
          <h1>Settings & history</h1>
          <p>
            Connect your AI, choose your defaults, and manage saved evaluations.
          </p>
        </div>
        <Link className="nm-btn" href="/dashboard">
          Back to studio <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="stack gap-7">
        {error && <Notice tone="error">{error}</Notice>}
        {message && <Notice tone="success">{message}</Notice>}
        <section
          className="nm-raised card stack"
          aria-labelledby="keys-heading"
        >
          <div className="row gap-3">
            <KeyRound size={22} className="text-emerald-700" />
            <div>
              <h2 id="keys-heading">Your AI connections</h2>
              <p className="text-sm muted mt-2">
                API keys are encrypted on the server. Provider usage is billed
                to your account.
              </p>
            </div>
          </div>
          {PROVIDER_IDS.map((p) => {
            const saved = keys.find((k) => k.provider === p);
            return (
              <div className="nm-inset p-4 sm:p-5 stack gap-4" key={p}>
                <div className="row between wrap">
                  <div className="row gap-3">
                    <span className="nm-flat-sm w-10 h-10 grid place-items-center text-emerald-700 font-bold">
                      {p === "google" ? "G" : p === "anthropic" ? "A" : "O"}
                    </span>
                    <div>
                      <h3>{AI_PROVIDERS[p].name}</h3>
                      <p className="text-xs muted mt-1">
                        {saved ? saved.keyHint : "No key connected"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={"badge " + (saved?.isValid ? "badge-green" : "")}
                  >
                    {saved?.isValid ? (
                      <>
                        <Check size={12} />
                        Connected
                      </>
                    ) : (
                      "Not connected"
                    )}
                  </span>
                </div>
                <div className="row wrap gap-2">
                  <button
                    className={saved ? "nm-btn" : "nm-btn-primary"}
                    onClick={() => setConnecting(p)}
                  >
                    <Plus size={15} />
                    {saved
                      ? "Replace key"
                      : "Connect " + AI_PROVIDERS[p].shortName}
                  </button>
                  {saved && (
                    <button
                      className="nm-btn"
                      onClick={() =>
                        setDeleting({
                          kind: "key",
                          id: p,
                          name: AI_PROVIDERS[p].name,
                        })
                      }
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <p className="text-xs muted row items-start">
            <ShieldCheck size={17} className="text-emerald-700" />
            <span>
              Only masked key previews reach this page. Keys are decrypted on
              the server solely to contact your chosen provider.{" "}
              <Link className="text-link" href="/privacy">
                How your data is handled
              </Link>
            </span>
          </p>
        </section>
        <section
          className="nm-raised card stack"
          aria-labelledby="defaults-heading"
        >
          <div className="row">
            <SlidersHorizontal size={22} className="text-emerald-700" />
            <h2 id="defaults-heading">Evaluation defaults</h2>
          </div>
          <p className="text-sm muted">
            Start each new review with these settings. Saved evaluations keep
            their original configuration.
          </p>
          <ModelControls
            provider={provider}
            modelId={modelId}
            effort={effort}
            keys={keys}
            onChange={change}
            disabled={busy}
          />
          <button
            className="nm-btn-primary self-start"
            onClick={saveDefaults}
            disabled={busy}
          >
            {busy ? "Saving…" : "Save defaults"}
          </button>
        </section>
        <section
          id="history"
          className="nm-raised card stack"
          style={{ scrollMarginTop: 110 }}
          aria-labelledby="history-heading"
        >
          <div className="row between wrap">
            <div className="row">
              <History size={22} className="text-emerald-700" />
              <h2 id="history-heading">Saved evaluations</h2>
            </div>
            <span className="badge">Latest {jobs.length} runs</span>
          </div>
          <p className="text-sm muted">
            Open a run to review its original criteria, scores, and evidence.
            Delete it to remove its saved candidate text and results.
          </p>
          {loading ? (
            <p role="status" className="text-sm muted">
              Loading your history…
            </p>
          ) : jobs.length === 0 ? (
            <div className="nm-inset p-7 text-center">
              <p className="text-sm muted">
                Your first completed evaluation will appear here.
              </p>
              <Link
                className="text-link text-sm mt-3 inline-block"
                href="/dashboard"
              >
                Start a review
              </Link>
            </div>
          ) : (
            <div className="stack gap-3">
              {jobs.map((j) => (
                <div className="queue-row" key={j.id}>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm break-words">{j.title}</h3>
                    <p className="text-xs muted mt-2 break-words">
                      {j.modelUsed} · {j.totalCandidates} CVs ·{" "}
                      {j.shortlistedCount} shortlisted
                    </p>
                    <p className="text-xs muted mt-1">
                      {new Date(j.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      ·{" "}
                      {j.status === "partial"
                        ? "Some CVs need review"
                        : j.status === "failed"
                          ? "Provider evaluation failed"
                          : "Completed"}
                    </p>
                  </div>
                  <Link
                    className="nm-btn icon-btn"
                    aria-label={"Open " + j.title}
                    href={"/dashboard?job=" + encodeURIComponent(j.id)}
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                  <button
                    className="nm-btn icon-btn"
                    aria-label={"Delete " + j.title}
                    onClick={() =>
                      setDeleting({ kind: "run", id: j.id, name: j.title })
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <Dialog
        open={Boolean(connecting)}
        onClose={() => setConnecting(null)}
        title={
          connecting ? "Connect " + AI_PROVIDERS[connecting].name : "Connect AI"
        }
        description="Verify access before adding a key to your encrypted vault."
      >
        {connecting && (
          <KeyForm
            key={connecting}
            provider={connecting}
            replacing={keys.some((k) => k.provider === connecting)}
            onSaved={async () => {
              await refresh();
              setConnecting(null);
              setMessage("Your provider key is verified and connected.");
            }}
          />
        )}
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onClose={() => {
          if (!busy) setDeleting(null);
        }}
        title={
          deleting?.kind === "key"
            ? "Remove this API key?"
            : "Delete this saved evaluation?"
        }
      >
        <div className="stack">
          <p className="text-sm muted break-words">
            {deleting?.kind === "key"
              ? "Removing " +
                deleting.name +
                " means new evaluations using that provider will need a new key. Existing results are kept."
              : "This permanently removes “" +
                deleting?.name +
                "”, its saved results, and candidate CV text. Export anything you need first."}
          </p>
          {error && <Notice tone="error">{error}</Notice>}
          <div className="row wrap justify-end">
            <button
              className="nm-btn"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Keep it
            </button>
            <button className="nm-btn-primary" disabled={busy} onClick={remove}>
              <Trash2 size={16} />
              {busy
                ? "Removing…"
                : deleting?.kind === "key"
                  ? "Remove key"
                  : "Delete evaluation"}
            </button>
          </div>
        </div>
      </Dialog>
    </main>
  );
}
