CREATE TABLE IF NOT EXISTS entry_details (
  entry_id TEXT PRIMARY KEY NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  category_code TEXT NOT NULL,
  deliveries INTEGER,
  online_minutes INTEGER,
  receipt_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS entry_details_kind_idx ON entry_details(kind);
CREATE INDEX IF NOT EXISTS entry_details_category_code_idx ON entry_details(category_code);

INSERT INTO entry_details (
  entry_id,
  kind,
  amount,
  category_code,
  deliveries,
  online_minutes,
  receipt_key
)
SELECT
  journal_entries.id,
  'income',
  journal_lines.amount,
  '501',
  CASE
    WHEN (
      SELECT count(*)
      FROM journal_entries same_day_entries
      INNER JOIN journal_lines same_day_lines
        ON same_day_lines.entry_id = same_day_entries.id
      INNER JOIN accounts same_day_accounts
        ON same_day_accounts.id = same_day_lines.account_id
      WHERE same_day_entries.user_id = journal_entries.user_id
        AND same_day_entries.entry_date = journal_entries.entry_date
        AND same_day_accounts.code = '501'
        AND same_day_lines.side = 'credit'
    ) = 1 THEN daily_stats.deliveries
    ELSE NULL
  END,
  CASE
    WHEN (
      SELECT count(*)
      FROM journal_entries same_day_entries
      INNER JOIN journal_lines same_day_lines
        ON same_day_lines.entry_id = same_day_entries.id
      INNER JOIN accounts same_day_accounts
        ON same_day_accounts.id = same_day_lines.account_id
      WHERE same_day_entries.user_id = journal_entries.user_id
        AND same_day_entries.entry_date = journal_entries.entry_date
        AND same_day_accounts.code = '501'
        AND same_day_lines.side = 'credit'
    ) = 1 THEN daily_stats.online_minutes
    ELSE NULL
  END,
  NULL
FROM journal_entries
INNER JOIN journal_lines ON journal_lines.entry_id = journal_entries.id
INNER JOIN accounts ON accounts.id = journal_lines.account_id
LEFT JOIN daily_stats
  ON daily_stats.user_id = journal_entries.user_id
  AND daily_stats.stat_date = journal_entries.entry_date
WHERE accounts.code = '501'
  AND journal_lines.side = 'credit'
ON CONFLICT(entry_id) DO NOTHING;

INSERT INTO entry_details (
  entry_id,
  kind,
  amount,
  category_code,
  deliveries,
  online_minutes,
  receipt_key
)
SELECT
  journal_entries.id,
  'expense',
  coalesce(cash_lines.amount, expense_lines.amount),
  expense_accounts.code,
  NULL,
  NULL,
  expense_lines.receipt_key
FROM journal_entries
INNER JOIN journal_lines expense_lines
  ON expense_lines.entry_id = journal_entries.id
INNER JOIN accounts expense_accounts
  ON expense_accounts.id = expense_lines.account_id
LEFT JOIN journal_lines cash_lines
  ON cash_lines.entry_id = journal_entries.id
  AND cash_lines.side = 'credit'
LEFT JOIN accounts cash_accounts
  ON cash_accounts.id = cash_lines.account_id
  AND cash_accounts.code = '101'
WHERE expense_accounts.category = 'expense'
  AND expense_lines.side = 'debit'
  AND cash_accounts.code = '101'
ON CONFLICT(entry_id) DO NOTHING;
