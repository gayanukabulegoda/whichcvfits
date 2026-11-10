import { z } from "zod";
import { getDatabase, type ApiKeyRow } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { encryptApiKey } from "@/lib/crypto";
import { providerSchema, effortSchema } from "@/lib/contracts";
import { availableModels } from "@/lib/llm/catalog";
import { verifyProviderApiKey } from "@/lib/llm/evaluator";
import {
  apiError,
  json,
  checkOrigin,
  readJson,
  rateLimit,
  HttpError,
} from "@/lib/http";
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Please sign in.");
    const rows = await (
      await getDatabase()
    ).all<ApiKeyRow>("SELECT * FROM api_keys WHERE user_id=?", [user.id]);
    return json({
      keys: rows.map((k) => ({
        id: k.id,
        provider: k.provider,
        keyHint: k.key_hint,
        isValid: Boolean(k.is_valid),
        availableModels: JSON.parse(k.available_models_json),
        updatedAt: k.updated_at,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Please sign in.");
    const body = await readJson(req, 4096);
    const db = await getDatabase();
    if (
      z.object({ action: z.literal("skip_onboarding") }).safeParse(body).success
    ) {
      await db.run("UPDATE users SET onboarding_completed=1 WHERE id=?", [
        user.id,
      ]);
      return json({ success: true });
    }
    await rateLimit(req, "keys", 10, 10 * 60000, user.id);
    const p = z
      .object({
        provider: providerSchema,
        apiKey: z.string().trim().min(16).max(512),
        preferredModel: z.string().max(100).optional(),
        preferredEffort: effortSchema.optional(),
      })
      .parse(body);
    const verification = await verifyProviderApiKey(p.provider, p.apiKey);
    if (!verification.valid)
      throw new HttpError(
        400,
        verification.error || "Key verification failed.",
      );
    const models = availableModels(p.provider, verification.discoveredModels);
    if (!models.length)
      throw new HttpError(
        400,
        "This key has no models currently supported by WhichCVFits. Check model access in your provider account.",
      );
    const requestedModel = p.preferredModel
      ? models.find((m) => m.id === p.preferredModel)
      : models[0];
    if (!requestedModel)
      throw new HttpError(
        400,
        "The selected model is not accessible with this key. Choose one of: " +
          models.map((m) => m.id).join(", ") +
          ".",
      );
    const model = requestedModel;
    const effort =
      p.preferredEffort && model.supportedEfforts.includes(p.preferredEffort)
        ? p.preferredEffort
        : model.defaultEffort;
    const encrypted = await encryptApiKey(p.apiKey);
    const now = new Date().toISOString();
    await db.batch([
      {
        sql: "INSERT INTO api_keys (id,user_id,provider,encrypted_key,iv,key_hint,is_valid,available_models_json,updated_at) VALUES (?,?,?,?,?,?,1,?,?) ON CONFLICT(user_id,provider) DO UPDATE SET encrypted_key=excluded.encrypted_key,iv=excluded.iv,key_hint=excluded.key_hint,is_valid=1,available_models_json=excluded.available_models_json,updated_at=excluded.updated_at",
        params: [
          crypto.randomUUID(),
          user.id,
          p.provider,
          encrypted.encryptedKey,
          encrypted.iv,
          encrypted.keyHint,
          JSON.stringify(verification.discoveredModels),
          now,
        ],
      },
      {
        sql: "UPDATE users SET onboarding_completed=1,preferred_provider=?,preferred_model=?,preferred_effort=? WHERE id=?",
        params: [p.provider, model.id, effort, user.id],
      },
    ]);
    return json({
      success: true,
      keyHint: encrypted.keyHint,
      preferredModel: model.id,
      preferredEffort: effort,
      discoveredModels: verification.discoveredModels,
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(req: Request) {
  try {
    checkOrigin(req);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Please sign in.");
    const provider = providerSchema.parse(
      new URL(req.url).searchParams.get("provider"),
    );
    await (
      await getDatabase()
    ).run("DELETE FROM api_keys WHERE user_id=? AND provider=?", [
      user.id,
      provider,
    ]);
    return json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
