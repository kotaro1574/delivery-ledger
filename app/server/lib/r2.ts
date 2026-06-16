import { getCloudflareContext } from "@opennextjs/cloudflare";

const contentTypeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function extensionFromContentType(contentType: string) {
  return contentTypeToExt[contentType] ?? "bin";
}

export function buildReceiptKey(
  userId: string,
  id: string,
  contentType: string,
) {
  return `r/${userId}/${id}.${extensionFromContentType(contentType)}`;
}

export async function getReceiptsBucket() {
  const { env } = await getCloudflareContext({ async: true });
  return env.RECEIPTS;
}
