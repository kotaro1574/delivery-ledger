import { getAuth } from "@server/lib/auth";
import { UnauthorizedError } from "@server/lib/errors";

export async function requireAuth(headers: Headers) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers });

  if (!session) {
    throw new UnauthorizedError("認証が必要です");
  }

  return session;
}
