-- ポータルのログイン機能で使う表

-- 設定。login_required が '1' ならログインが必要、'0' なら不要（最初は不要）
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO settings (key, value) VALUES ('login_required', '0');

-- 一度でもログインしたアカウント。blocked が 1 ならポータルを開けない
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  sub TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  first_login TEXT NOT NULL,
  last_login TEXT NOT NULL,
  login_count INTEGER NOT NULL DEFAULT 1,
  blocked INTEGER NOT NULL DEFAULT 0
);
