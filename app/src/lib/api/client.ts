import type { AppType } from "@server/index";
import { hc } from "hono/client";

function getRequestPathname(input: RequestInfo | URL): string | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : input.toString();

    return new URL(rawUrl, window.location.origin).pathname;
  } catch {
    return null;
  }
}

export const apiClient = hc<AppType>(process.env.NEXT_PUBLIC_APP_URL ?? "", {
  fetch: (async (input, init) => {
    const response = await fetch(input, {
      ...init,
      credentials: "include",
    });

    if (typeof window !== "undefined") {
      const pathname = getRequestPathname(input);
      const isAuthApi = pathname?.startsWith("/api/auth");

      if (!isAuthApi && response.status === 401) {
        window.location.href = "/login";
      }
    }

    return response;
  }) satisfies typeof fetch,
});
