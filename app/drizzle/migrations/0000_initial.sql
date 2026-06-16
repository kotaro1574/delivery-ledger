CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  image TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS session_user_id_idx ON session(user_id);

CREATE TABLE IF NOT EXISTS auth_account (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS auth_account_user_id_idx ON auth_account(user_id);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('asset', 'liability', 'equity', 'revenue', 'expense'))
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS journal_entries_user_date_idx ON journal_entries(user_id, entry_date);

CREATE TABLE IF NOT EXISTS journal_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  side TEXT NOT NULL CHECK (side IN ('debit', 'credit')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  receipt_key TEXT
);

CREATE INDEX IF NOT EXISTS journal_lines_entry_id_idx ON journal_lines(entry_id);

CREATE TABLE IF NOT EXISTS category_ratios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  business_ratio INTEGER NOT NULL DEFAULT 100 CHECK (business_ratio BETWEEN 1 AND 100),
  CONSTRAINT category_ratios_user_account_uq UNIQUE (user_id, account_id)
);

CREATE TABLE IF NOT EXISTS fixed_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  acquired_on TEXT NOT NULL,
  cost INTEGER NOT NULL,
  useful_life_years INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'straight_line',
  business_ratio INTEGER NOT NULL DEFAULT 100,
  account_id INTEGER REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  stat_date TEXT NOT NULL,
  deliveries INTEGER,
  online_minutes INTEGER,
  CONSTRAINT daily_stats_user_date_uq UNIQUE (user_id, stat_date)
);

INSERT INTO accounts (id, code, name, category) VALUES
  (101, '101', '現金', 'asset'),
  (102, '102', '普通預金', 'asset'),
  (135, '135', '売掛金', 'asset'),
  (180, '180', '車両運搬具', 'asset'),
  (184, '184', '工具器具備品', 'asset'),
  (334, '334', '事業主貸', 'asset'),
  (305, '305', '未払金', 'liability'),
  (335, '335', '事業主借', 'liability'),
  (410, '410', '元入金', 'equity'),
  (501, '501', '売上高', 'revenue'),
  (601, '601', '車両費', 'expense'),
  (602, '602', '旅費交通費', 'expense'),
  (603, '603', '通信費', 'expense'),
  (604, '604', '消耗品費', 'expense'),
  (605, '605', '損害保険料', 'expense'),
  (606, '606', '修繕費', 'expense'),
  (607, '607', '減価償却費', 'expense'),
  (699, '699', '雑費', 'expense')
ON CONFLICT (id) DO UPDATE SET
  code = excluded.code,
  name = excluded.name,
  category = excluded.category;
