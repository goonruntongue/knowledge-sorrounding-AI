-- ポータルのカード（ガイドのページ）にかける鍵

-- ページごとの鍵。page はガイドのフォルダー名（例: ai-agents）。locked が 1 なら鍵がかかっている
CREATE TABLE IF NOT EXISTS page_locks (
  page TEXT PRIMARY KEY,
  locked INTEGER NOT NULL DEFAULT 0
);

-- アカウントごとの例外。access が 'allow' なら鍵を外して入れる、'deny' なら鍵をかけて入れない
CREATE TABLE IF NOT EXISTS page_access (
  email TEXT NOT NULL,
  page TEXT NOT NULL,
  access TEXT NOT NULL CHECK (access IN ('allow', 'deny')),
  PRIMARY KEY (email, page)
);

-- 管理者にも鍵を適用するか（デバッグ用）。'1' なら管理者もほかの人と同じように扱う
INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_obeys_locks', '0');
