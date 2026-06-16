import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AwsClient } from "aws4fetch";

const ttlSeconds = 900;

function required(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export async function createPresignedReceiptUploadUrl(key: string) {
  const { env } = await getCloudflareContext({ async: true });
  const bucketName = required(env.R2_BUCKET_NAME, "R2_BUCKET_NAME");
  const accountId = required(
    env.CLOUDFLARE_ACCOUNT_ID,
    "CLOUDFLARE_ACCOUNT_ID",
  );
  const accessKeyId = required(env.R2_ACCESS_KEY_ID, "R2_ACCESS_KEY_ID");
  const secretAccessKey = required(
    env.R2_SECRET_ACCESS_KEY,
    "R2_SECRET_ACCESS_KEY",
  );
  const client = new AwsClient({ accessKeyId, secretAccessKey });
  const url = new URL(
    `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`,
  );

  url.searchParams.set("X-Amz-Expires", String(ttlSeconds));

  const signed = await client.sign(new Request(url, { method: "PUT" }), {
    aws: { signQuery: true },
  });

  return signed.url;
}
