CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      preferred_provider TEXT NOT NULL DEFAULT 'google',
      preferred_model TEXT NOT NULL DEFAULT 'gemini-3.8-flash',
      preferred_effort TEXT NOT NULL DEFAULT 'high',
      theme_palette TEXT NOT NULL DEFAULT 'frontier',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      encrypted_key TEXT NOT NULL,
      iv TEXT NOT NULL,
      key_hint TEXT NOT NULL,
      is_valid INTEGER NOT NULL DEFAULT 1,
      available_models_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, provider)
    );

    CREATE TABLE IF NOT EXISTS evaluation_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      requirement_text TEXT NOT NULL,
      rubric_weights_json TEXT NOT NULL,
      dealbreakers_json TEXT NOT NULL DEFAULT '[]',
      min_pass_score INTEGER NOT NULL DEFAULT 70,
      provider_used TEXT NOT NULL,
      model_used TEXT NOT NULL,
      effort_used TEXT NOT NULL,
      total_candidates INTEGER NOT NULL DEFAULT 0,
      shortlisted_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidate_evaluations (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES evaluation_jobs(id) ON DELETE CASCADE,
      candidate_name TEXT NOT NULL,
      candidate_email TEXT NOT NULL DEFAULT '',
      candidate_role TEXT NOT NULL DEFAULT '',
      years_experience TEXT NOT NULL DEFAULT '',
      file_name TEXT NOT NULL,
      raw_cv_text TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      grade_tier TEXT NOT NULL,
      is_filtered_in INTEGER NOT NULL,
      sub_scores_json TEXT NOT NULL,
      matched_skills_json TEXT NOT NULL,
      missing_skills_json TEXT NOT NULL,
      red_flags_json TEXT NOT NULL,
      evidence_quotes_json TEXT NOT NULL,
      executive_summary TEXT NOT NULL,
      recommendation_verdict TEXT NOT NULL,
      interview_questions_json TEXT NOT NULL,
      reasoning_log TEXT NOT NULL DEFAULT '',
      rank_order INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
