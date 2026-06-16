import { describe, expect, it } from "vitest";
import { calculateMetrics } from "./metrics";

describe("calculateMetrics", () => {
  it("売上、分、件数から時給と1件単価を計算する", () => {
    expect(
      calculateMetrics({
        revenue: 12000,
        deliveries: 24,
        onlineMinutes: 360,
      }),
    ).toEqual({
      wagePerHour: 2000,
      perDelivery: 500,
      deliveries: 24,
      onlineHours: 6,
    });
  });

  it("分や件数がない場合は0を返す", () => {
    expect(
      calculateMetrics({
        revenue: 12000,
        deliveries: 0,
        onlineMinutes: 0,
      }),
    ).toEqual({
      wagePerHour: 0,
      perDelivery: 0,
      deliveries: 0,
      onlineHours: 0,
    });
  });
});
