export type SqlValue = string | number | null;
export interface Statement {
  sql: string;
  params?: SqlValue[];
}
export interface Database {
  get<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
  all<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  run(sql: string, params?: SqlValue[]): Promise<void>;
  batch(statements: Statement[]): Promise<void>;
}
export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  onboarding_completed: number;
  preferred_provider: string;
  preferred_model: string;
  preferred_effort: string;
  theme_palette: string;
  created_at: string;
}
export interface ApiKeyRow {
  id: string;
  user_id: string;
  provider: "google" | "anthropic" | "openai";
  encrypted_key: string;
  iv: string;
  key_hint: string;
  is_valid: number;
  available_models_json: string;
  updated_at: string;
}
