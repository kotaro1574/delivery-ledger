import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ForbiddenError, NotFoundError } from "@server/lib/errors";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReceiptsService } from "./service";

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ReceiptsService.createUploadUrl", () => {
  it("presigned credential がない場合は Worker 経由のR2アップロードURLを返す", async () => {
    vi.mocked(getCloudflareContext).mockResolvedValue({
      env: {
        R2_BUCKET_NAME: "delivery-ledger-receipts",
        UPLOAD_MODE: "presigned",
      },
    } as unknown as Awaited<ReturnType<typeof getCloudflareContext>>);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111",
    );

    const result = await ReceiptsService.createUploadUrl("user-1", {
      contentType: "image/jpeg",
    });

    expect(result).toEqual({
      key: "r/user-1/11111111-1111-4111-8111-111111111111.jpg",
      url: "/api/receipts/local-upload?key=r%2Fuser-1%2F11111111-1111-4111-8111-111111111111.jpg",
    });
  });
});

describe("ReceiptsService.view", () => {
  it("ユーザー自身のレシート画像をR2から返す", async () => {
    const body = new TextEncoder().encode("receipt-image");
    const bucket = {
      get: vi.fn(
        async () =>
          ({
            body: new Response(body).body,
            httpEtag: '"receipt-etag"',
            httpMetadata: { contentType: "image/jpeg" },
          }) as R2ObjectBody,
      ),
    };
    vi.mocked(getCloudflareContext).mockResolvedValue({
      env: {
        RECEIPTS: bucket,
      },
    } as unknown as Awaited<ReturnType<typeof getCloudflareContext>>);

    const response = await ReceiptsService.view(
      "user-1",
      "r/user-1/receipt.jpg",
    );

    expect(bucket.get).toHaveBeenCalledWith("r/user-1/receipt.jpg");
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toBe("private, max-age=300");
    expect(response.headers.get("etag")).toBe('"receipt-etag"');
    expect(await response.text()).toBe("receipt-image");
  });

  it("他ユーザーのレシート画像は返さない", async () => {
    await expect(
      ReceiptsService.view("user-1", "r/user-2/receipt.jpg"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("R2に存在しないレシート画像は not found にする", async () => {
    const bucket = {
      get: vi.fn(async () => null),
    };
    vi.mocked(getCloudflareContext).mockResolvedValue({
      env: {
        RECEIPTS: bucket,
      },
    } as unknown as Awaited<ReturnType<typeof getCloudflareContext>>);

    await expect(
      ReceiptsService.view("user-1", "r/user-1/missing.jpg"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
