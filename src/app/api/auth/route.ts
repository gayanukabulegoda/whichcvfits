import { z } from "zod";
import { getDatabase, type UserRow } from "@/db";
import {
  createSessionCookie,
  clearSessionCookie,
  getCurrentUser,
} from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { providerSchema, effortSchema } from "@/lib/contracts";
import { getModelById, validPreferences } from "@/lib/llm/catalog";
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
    if (!user) return json({ authenticated: false, user: null, keys: [] });
    const rows = await (
      await getDatabase()
    ).all<{
      id: string;
      provider: string;
      key_hint: string;
      is_valid: number;
      available_models_json: string;
    }>(
      "SELECT id,provider,key_hint,is_valid,available_models_json FROM api_keys WHERE user_id=?",
      [user.id],
    );
    const prefs = validPreferences(
      user.preferred_provider,
      user.preferred_model,
      user.preferred_effort,
    );
    return json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingCompleted: Boolean(user.onboarding_completed),
        preferredProvider: prefs.provider,
        preferredModel: prefs.modelId,
        preferredEffort: prefs.effort,
      },
      keys: rows.map((k) => ({
        id: k.id,
        provider: k.provider,
        keyHint: k.key_hint,
        isValid: Boolean(k.is_valid),
        availableModels: JSON.parse(k.available_models_json),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const body = await readJson(req, 8192);
    const { action } = z.object({ action: z.string() }).parse(body);
    if (action === "logout") {
      await clearSessionCookie();
      return json({ success: true });
    }
    const db = await getDatabase();
    if (action === "update_preferences") {
      const user = await getCurrentUser();
      if (!user) throw new HttpError(401, "Please sign in.");
      const p = z
        .object({
          preferredProvider: providerSchema.optional(),
          preferredModel: z.string().max(100).optional(),
          preferredEffort: effortSchema.optional(),
          onboardingCompleted: z.boolean().optional(),
        })
        .parse(body);
      const provider = p.preferredProvider || user.preferred_provider;
      const model = p.preferredModel || user.preferred_model;
      const selected = getModelById(model);
      if (!selected || selected.provider !== provider)
        throw new HttpError(400, "Choose a supported model for this provider.");
      if (
        selected.supportedEfforts.length &&
        p.preferredEffort &&
        !selected.supportedEfforts.includes(p.preferredEffort)
      )
        throw new HttpError(400, "Choose a supported reasoning effort.");
      await db.run(
        "UPDATE users SET preferred_provider=?,preferred_model=?,preferred_effort=?,onboarding_completed=?,theme_palette=? WHERE id=?",
        [
          provider,
          model,
          p.preferredEffort || user.preferred_effort,
          p.onboardingCompleted === undefined
            ? user.onboarding_completed
            : Number(p.onboardingCompleted),
          "frontier",
          user.id,
        ],
      );
      return json({ success: true });
    }
    if (action === "signup") {
      await rateLimit(req, "signup", 10, 15 * 60000);
      const p = z
        .object({
          name: z.string().trim().min(2).max(100),
          email: z.email().trim().toLowerCase().max(254),
          password: z
            .string()
            .min(10, "Use at least 10 characters for your password.")
            .max(256),
        })
        .parse(body);
      if (await db.get("SELECT id FROM users WHERE email=?", [p.email]))
        throw new HttpError(
          409,
          "An account with this email already exists. Please sign in.",
        );
      const id = crypto.randomUUID();
      await db.run(
        "INSERT INTO users (id,name,email,password_hash,onboarding_completed,preferred_provider,preferred_model,preferred_effort,theme_palette,created_at) VALUES (?,?,?,?,0,'google','gemini-3.8-flash','medium','frontier',?)",
        [
          id,
          p.name,
          p.email,
          await hashPassword(p.password),
          new Date().toISOString(),
        ],
      );
      await createSessionCookie({ id, email: p.email, name: p.name });
      return json({ success: true, redirectTo: "/onboarding" });
    }
    if (action === "login") {
      await rateLimit(req, "login", 15, 15 * 60000);
      const p = z
        .object({
          email: z.string().trim().toLowerCase().max(254),
          password: z.string().min(1).max(256),
        })
        .parse(body);
      const user = await db.get<UserRow>("SELECT * FROM users WHERE email=?", [
        p.email,
      ]);
      // Do comparable password work for unknown users without exposing account existence.
      const valid = user
        ? await verifyPassword(p.password, user.password_hash)
        : (await hashPassword(p.password), false);
      if (!user || !valid)
        throw new HttpError(401, "The email or password is incorrect.");
      await createSessionCookie(user);
      return json({
        success: true,
        redirectTo: user.onboarding_completed ? "/dashboard" : "/onboarding",
      });
    }
    throw new HttpError(400, "This action is not supported.");
  } catch (error) {
    return apiError(error);
  }
}
