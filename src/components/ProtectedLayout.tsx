import { requireUser } from "@/lib/auth";
import { getDatabase, type ApiKeyRow } from "@/db";
import { validPreferences } from "@/lib/llm/catalog";
import type { SessionUser } from "@/lib/contracts";
import WorkspaceProvider from "./WorkspaceProvider";
import Navbar from "./Navbar";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const row = await requireUser();
  const prefs = validPreferences(
    row.preferred_provider,
    row.preferred_model,
    row.preferred_effort,
  );
  const user: SessionUser = {
    id: row.id,
    name: row.name,
    email: row.email,
    onboardingCompleted: Boolean(row.onboarding_completed),
    preferredProvider: prefs.provider,
    preferredModel: prefs.modelId,
    preferredEffort: prefs.effort,
  };
  const rows = await (
    await getDatabase()
  ).all<ApiKeyRow>("SELECT * FROM api_keys WHERE user_id=?", [row.id]);
  const keys = rows.map((k) => ({
    id: k.id,
    provider: k.provider,
    keyHint: k.key_hint,
    isValid: Boolean(k.is_valid),
    availableModels: JSON.parse(k.available_models_json),
  }));
  return (
    <WorkspaceProvider user={user} keys={keys}>
      <Navbar user={user} />
      {children}
    </WorkspaceProvider>
  );
}
