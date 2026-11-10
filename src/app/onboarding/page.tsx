"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  AI_PROVIDERS,
  PROVIDER_IDS,
  type AIProviderId,
} from "@/lib/llm/catalog";
import { post, errorMessage } from "@/lib/client";
import KeyForm from "@/components/KeyForm";
import Notice from "@/components/Notice";
export default function OnboardingPage() {
  const { user, keys, refresh } = useWorkspace();
  const router = useRouter();
  const [provider, setProvider] = useState<AIProviderId>("google");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function skip() {
    setBusy(true);
    try {
      await post("/api/keys", { action: "skip_onboarding" });
      router.push("/dashboard");
      router.refresh();
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
          <span className="eyebrow">
            One optional step before your first review
          </span>
          <h1>Make yourself at home, {user.name.split(" ")[0]}.</h1>
          <p>
            Connect the AI provider you want to use. You can also explore first.
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-[1fr_1.3fr] gap-6 items-start">
        <div className="stack">
          <div className="nm-flat card stack">
            <span className="eyebrow">01 · Choose your provider</span>
            {PROVIDER_IDS.map((p) => (
              <button
                className="sample-candidate"
                key={p}
                aria-pressed={provider === p}
                onClick={() => setProvider(p)}
              >
                <span className="min-w-0 flex-1">
                  <strong className="text-sm block">
                    {AI_PROVIDERS[p].name}
                  </strong>
                  <span className="text-xs muted block mt-1">
                    {keys.some((k) => k.provider === p)
                      ? "Connected"
                      : AI_PROVIDERS[p].description}
                  </span>
                </span>
                {provider === p && (
                  <Check size={18} className="text-emerald-700" />
                )}
              </button>
            ))}
          </div>
          <div className="row items-start px-2 text-xs muted">
            <ShieldCheck size={18} className="text-emerald-700" />
            <p>
              You control which provider receives CV text. API usage is billed
              by that provider.
            </p>
          </div>
        </div>
        <div className="nm-raised card stack">
          <div>
            <span className="eyebrow">02 · Connect securely</span>
            <h2 className="mt-3">{AI_PROVIDERS[provider].name}</h2>
          </div>
          <KeyForm
            key={provider}
            provider={provider}
            replacing={keys.some((k) => k.provider === provider)}
            onSaved={refresh}
          />
          {keys.length > 0 && (
            <button
              className="nm-btn-emerald"
              onClick={() => router.push("/dashboard")}
            >
              Continue to studio <ArrowRight size={17} />
            </button>
          )}
          <div className="divider">
            <button
              className="text-link text-sm py-2"
              onClick={skip}
              disabled={busy}
            >
              {busy ? "Opening studio…" : "Skip for now and explore the studio"}
            </button>
            <p className="text-xs muted mt-2">
              A verified key is required only when you run a real evaluation.
            </p>
          </div>
          {error && <Notice tone="error">{error}</Notice>}
        </div>
      </div>
    </main>
  );
}
