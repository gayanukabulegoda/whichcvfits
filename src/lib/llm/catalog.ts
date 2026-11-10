export type AIProviderId = "google" | "anthropic" | "openai";
export type ReasoningEffort = "low" | "medium" | "high";
export const PROVIDER_IDS: AIProviderId[] = ["google", "anthropic", "openai"];
export interface ModelOption {
  id: string;
  label: string;
  provider: AIProviderId;
  supportedEfforts: ReasoningEffort[];
  defaultEffort: ReasoningEffort;
  thinking: "level" | "budget" | "adaptive" | "reasoning" | "none";
}
export const AI_PROVIDERS = {
  google: {
    name: "Google Gemini",
    shortName: "Gemini",
    docsUrl: "https://aistudio.google.com/app/apikey",
    keyPlaceholder: "AIza…",
    description:
      "Connect a Google AI Studio API key. API access and quotas depend on your account.",
  },
  anthropic: {
    name: "Anthropic Claude",
    shortName: "Claude",
    docsUrl: "https://platform.claude.com/settings/keys",
    keyPlaceholder: "sk-ant-…",
    description:
      "Connect an Anthropic API key with access to your chosen Claude model.",
  },
  openai: {
    name: "OpenAI",
    shortName: "OpenAI",
    docsUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-…",
    description:
      "Connect an OpenAI API key. Your provider bills any API usage directly.",
  },
} as const;
const efforts: ReasoningEffort[] = ["low", "medium", "high"];
export const MODEL_CATALOG: ModelOption[] = [
  {
    id: "gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    provider: "google",
    supportedEfforts: efforts,
    defaultEffort: "medium",
    thinking: "level",
  },
  {
    id: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro · preview",
    provider: "google",
    supportedEfforts: efforts,
    defaultEffort: "high",
    thinking: "level",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "google",
    supportedEfforts: efforts,
    defaultEffort: "medium",
    thinking: "budget",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "google",
    supportedEfforts: efforts,
    defaultEffort: "high",
    thinking: "budget",
  },
  {
    id: "claude-sonnet-5-5",
    label: "Claude Sonnet 5.5",
    provider: "anthropic",
    supportedEfforts: efforts,
    defaultEffort: "high",
    thinking: "adaptive",
  },
  {
    id: "claude-opus-5-5",
    label: "Claude Opus 5.5",
    provider: "anthropic",
    supportedEfforts: efforts,
    defaultEffort: "medium",
    thinking: "adaptive",
  },
  {
    id: "claude-haiku-5-5",
    label: "Claude Haiku 5.5",
    provider: "anthropic",
    supportedEfforts: efforts,
    defaultEffort: "medium",
    thinking: "adaptive",
  },
  {
    id: "gpt-5",
    label: "GPT-5",
    provider: "openai",
    supportedEfforts: efforts,
    defaultEffort: "medium",
    thinking: "reasoning",
  },
  {
    id: "gpt-5-mini",
    label: "GPT-5 mini",
    provider: "openai",
    supportedEfforts: efforts,
    defaultEffort: "medium",
    thinking: "reasoning",
  },
  {
    id: "o3",
    label: "o3",
    provider: "openai",
    supportedEfforts: efforts,
    defaultEffort: "medium",
    thinking: "reasoning",
  },
  {
    id: "gpt-4.1",
    label: "GPT-4.1",
    provider: "openai",
    supportedEfforts: [],
    defaultEffort: "medium",
    thinking: "none",
  },
];
export const EFFORT_LABELS = {
  low: {
    shortLabel: "Fast",
    description: "Lower reasoning effort. Usually quicker and less expensive.",
  },
  medium: {
    shortLabel: "Balanced",
    description: "A balance of reasoning depth, speed, and provider usage.",
  },
  high: {
    shortLabel: "Thorough",
    description: "More reasoning effort. May take longer and cost more.",
  },
};
export const getModelsForProvider = (provider: AIProviderId) =>
  MODEL_CATALOG.filter((m) => m.provider === provider);
export const getModelById = (id: string) =>
  MODEL_CATALOG.find((m) => m.id === id);
export function availableModels(
  provider: AIProviderId,
  discovered: string[] = [],
) {
  const models = getModelsForProvider(provider);
  return discovered.length
    ? models.filter((m) => discovered.includes(m.id))
    : models;
}
export function validPreferences(
  provider: string,
  model: string,
  effort: string,
) {
  const p = PROVIDER_IDS.includes(provider as AIProviderId)
    ? (provider as AIProviderId)
    : "google";
  const m =
    getModelsForProvider(p).find((m) => m.id === model) ||
    getModelsForProvider(p)[0];
  const e = m.supportedEfforts.includes(effort as ReasoningEffort)
    ? (effort as ReasoningEffort)
    : m.defaultEffort;
  return { provider: p, modelId: m.id, effort: e };
}
