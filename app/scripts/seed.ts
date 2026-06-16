import { spawnSync } from "node:child_process";
import { initialAccounts } from "../server/lib/accounts";

const values = initialAccounts
  .map(
    (account) =>
      `(${account.id}, '${account.code}', '${account.name}', '${account.category}')`,
  )
  .join(", ");

const sql = `
INSERT INTO accounts (id, code, name, category) VALUES ${values}
ON CONFLICT (id) DO UPDATE SET
  code = excluded.code,
  name = excluded.name,
  category = excluded.category;
`;

const isRemote = process.argv.includes("--remote");
const flag = isRemote ? "--remote" : "--local";
const envIndex = process.argv.indexOf("--env");
const env = envIndex >= 0 ? process.argv[envIndex + 1] : "dev";
const args = [
  "wrangler",
  "d1",
  "execute",
  "delivery-ledger-db",
  flag,
  "--env",
  env,
  "--command",
  sql.replace(/\s+/g, " ").trim(),
];

const result = spawnSync("npx", args, { stdio: "inherit" });

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
