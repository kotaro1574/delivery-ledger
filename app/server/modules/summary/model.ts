import { z } from "zod";

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);

export namespace SummaryModel {
  export const Query = z.object({
    month: monthSchema,
  });
  export type Query = z.infer<typeof Query>;

  export const Category = z.object({
    code: z.string(),
    name: z.string(),
    amount: z.number(),
  });
  export type Category = z.infer<typeof Category>;

  export const Response = z.object({
    revenue: z.number(),
    expense: z.number(),
    profit: z.number(),
    byCategory: z.array(Category),
    metrics: z.object({
      wagePerHour: z.number(),
      perDelivery: z.number(),
      deliveries: z.number(),
      onlineHours: z.number(),
    }),
  });
  export type Response = z.infer<typeof Response>;
}
