CREATE TABLE IF NOT EXISTS evaluation_requests (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY(user_id,request_id)
);
