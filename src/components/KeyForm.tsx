"use client";
import { useId, useState } from "react";
import { Eye, EyeOff, ExternalLink, KeyRound } from "lucide-react";
import {
  AI_PROVIDERS,
  EFFORT_LABELS,
  type ReasoningEffort,
  getModelsForProvider,
  type AIProviderId,
} from "@/lib/llm/catalog";
import { post, errorMessage } from "@/lib/client";
import Notice from "./Notice";
export default function KeyForm({
  provider,
  onSaved,
  replacing = false,
}: {
  provider: AIProviderId;
  onSaved: () => Promise<void>;
  replacing?: boolean;
}) {
  const id = useId();
  const [key, setKey] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const models = getModelsForProvider(provider);
  const [model, setModel] = useState(models[0].id);
  const selectedModel = models.find((item) => item.id === model)!;
  const [effort, setEffort] = useState<ReasoningEffort>(
    models[0].defaultEffort,
  );
  const meta = AI_PROVIDERS[provider];
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const data = await post<{ preferredModel: string }>("/api/keys", {
        provider,
        apiKey: key,
        preferredModel: model,
        preferredEffort: effort,
      });
      setKey("");
      setSuccess(
        "Key verified and encrypted. Default model: " +
          data.preferredModel +
          ".",
      );
      await onSaved();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="stack gap-4" onSubmit={submit}>
      <div className="field">
        <div className="row between wrap">
          <label htmlFor={id}>
            {replacing ? "Replace" : "Connect"} {meta.shortName} API key
          </label>
          <a
            className="text-link text-xs py-2"
            href={meta.docsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Get a key <ExternalLink size={12} className="inline" />
          </a>
        </div>
        <div className="password-control">
          <input
            className="nm-input font-mono"
            id={id}
            type={visible ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={meta.keyPlaceholder}
            required
            minLength={16}
            maxLength={512}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={id + "-help"}
          />
          <button
            type="button"
            aria-label={visible ? "Hide API key" : "Show API key"}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <small id={id + "-help"}>
          Stored with server-side encryption. Only a masked preview is returned.
        </small>
      </div>
      <details className="text-sm">
        <summary>Optional evaluation defaults</summary>
        <div className="field">
          <label htmlFor={id + "-model"}>Preferred model</label>
          <select
            id={id + "-model"}
            className="nm-input"
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setEffort(
                models.find((item) => item.id === e.target.value)!
                  .defaultEffort,
              );
            }}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <small>
            Verification checks which supported models your key can access. You
            can change the default in Settings.
          </small>
        </div>
        {selectedModel.supportedEfforts.length > 0 && (
          <div className="field mt-4">
            <label htmlFor={id + "-effort"}>Reasoning effort</label>
            <select
              id={id + "-effort"}
              className="nm-input"
              value={effort}
              onChange={(e) => setEffort(e.target.value as ReasoningEffort)}
            >
              {selectedModel.supportedEfforts.map((value) => (
                <option key={value} value={value}>
                  {EFFORT_LABELS[value].shortLabel}
                </option>
              ))}
            </select>
            <small>{EFFORT_LABELS[effort].description}</small>
          </div>
        )}
      </details>
      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}
      <button
        type="submit"
        className="nm-btn-primary"
        disabled={busy || !key.trim()}
      >
        <KeyRound size={16} />
        {busy
          ? "Verifying with provider…"
          : replacing
            ? "Verify & replace key"
            : "Verify & connect"}
      </button>
    </form>
  );
}
