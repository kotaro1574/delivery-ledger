import { getCloudflareContext } from "@opennextjs/cloudflare";
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
