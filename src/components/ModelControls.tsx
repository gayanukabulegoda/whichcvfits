"use client";
import { useId } from "react";
import {
  AI_PROVIDERS,
  PROVIDER_IDS,
  availableModels,
  getModelsForProvider,
  getModelById,
  EFFORT_LABELS,
  type AIProviderId,
  type ReasoningEffort,
} from "@/lib/llm/catalog";
import type { SavedKey } from "@/lib/contracts";
export default function ModelControls({
  provider,
  modelId,
  effort,
  onChange,
  keys,
  disabled = false,
}: {
  provider: AIProviderId;
  modelId: string;
  effort: ReasoningEffort;
  onChange: (
    provider: AIProviderId,
    modelId: string,
    effort: ReasoningEffort,
  ) => void;
  keys: SavedKey[];
  disabled?: boolean;
}) {
  const id = useId();
  const key = keys.find((k) => k.provider === provider && k.isValid);
  const models = availableModels(provider, key?.availableModels);
  const model = getModelById(modelId);
  return (
    <fieldset className="stack gap-4 min-w-0" disabled={disabled}>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="field">
          <label htmlFor={id + "provider"}>AI provider</label>
          <select
            id={id + "provider"}
            className="nm-input"
            value={provider}
            onChange={(e) => {
              const p = e.target.value as AIProviderId;
              const next =
                availableModels(
                  p,
                  keys.find((k) => k.provider === p)?.availableModels,
                )[0] || getModelsForProvider(p)[0];
              onChange(p, next.id, next.defaultEffort);
            }}
          >
            {PROVIDER_IDS.map((p) => (
              <option key={p} value={p}>
                {AI_PROVIDERS[p].name}
                {keys.some((k) => k.provider === p && k.isValid)
                  ? " · connected"
                  : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={id + "model"}>Model</label>
          <select
            id={id + "model"}
            className="nm-input"
            value={modelId}
            onChange={(e) => {
              const m = getModelById(e.target.value)!;
              onChange(
                provider,
                m.id,
                m.supportedEfforts.includes(effort) ? effort : m.defaultEffort,
              );
            }}
          >
            {!models.some((m) => m.id === modelId) && (
              <option value={modelId} disabled>
                Unavailable · choose a model
              </option>
            )}
            {models.map((m) => (
              <option value={m.id} key={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {model?.supportedEfforts.length ? (
        <div className="field">
          <span className="field-label" id={id + "effort-label"}>
            Reasoning effort
          </span>
          <div
            className="nm-inset segmented"
            role="group"
            aria-labelledby={id + "effort-label"}
          >
            {model.supportedEfforts.map((e) => (
              <button
                type="button"
                key={e}
                aria-pressed={effort === e}
                onClick={() => onChange(provider, modelId, e)}
              >
                {EFFORT_LABELS[e].shortLabel}
              </button>
            ))}
          </div>
          <small>{EFFORT_LABELS[effort].description}</small>
        </div>
      ) : (
        <p className="text-xs muted">
          This model uses its standard reasoning settings.
        </p>
      )}
    </fieldset>
  );
}
