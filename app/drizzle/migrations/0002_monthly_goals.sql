CREATE TABLE IF NOT EXISTS monthly_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  month TEXT NOT NULL,
  target_amount INTEGER NOT NULL CHECK (target_amount > 0),
  CONSTRAINT monthly_goals_user_month_uq UNIQUE (user_id, month)
);
