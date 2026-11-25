import { z } from "zod";

export namespace GoalsModel {
  export const MonthParam = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
  });
  export type MonthParam = z.infer<typeof MonthParam>;

  export const UpsertRequest = z.object({
    targetAmount: z.number().int().positive().max(100_000_000),
  });
  export type UpsertRequest = z.infer<typeof UpsertRequest>;
}
