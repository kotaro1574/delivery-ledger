import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "@server/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";

export function createAuth(d1: D1Database, env: CloudflareEnv) {
  const db = drizzle(d1, { schema });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.authAccount,
        verification: schema.verification,
      },
      usePlural: false,
    }),
    trustedOrigins: [
      "http://localhost:3000",
      "http://localhost:8787",
      env.BETTER_AUTH_URL,
    ],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
  });
}

export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });
  return createAuth(env.DB, env);
}

export type Auth = ReturnType<typeof createAuth>;
