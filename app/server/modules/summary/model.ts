import { z } from "zod";

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);
const yearSchema = z.string().regex(/^\d{4}$/);

export namespace SummaryModel {
  export const Query = z.object({
    month: monthSchema,
  });
  export type Query = z.infer<typeof Query>;

  export const YearlyQuery = z.object({
    year: yearSchema,
  });
  export type YearlyQuery = z.infer<typeof YearlyQuery>;

  export const Category = z.object({
    code: z.string(),
    name: z.string(),
    amount: z.number(),
  });
  export type Category = z.infer<typeof Category>;

  export const Response = z.object({
    revenue: z.number(),
    expense: z.number(),
    paidExpense: z.number(),
    profit: z.number(),
    byCategory: z.array(Category),
    metrics: z.object({
      wagePerHour: z.number(),
      perDelivery: z.number(),
      deliveries: z.number(),
      onlineHours: z.number(),
      workDays: z.number(),
    }),
  });
  export type Response = z.infer<typeof Response>;

  export const YearlyMonth = z.object({
    month: monthSchema,
    label: z.string(),
    revenue: z.number(),
    expense: z.number(),
    paidExpense: z.number(),
    profit: z.number(),
    profitRate: z.number(),
  });
  export type YearlyMonth = z.infer<typeof YearlyMonth>;

  export const YearlyResponse = z.object({
    year: yearSchema,
    revenue: z.number(),
    expense: z.number(),
    paidExpense: z.number(),
    profit: z.number(),
    profitRate: z.number(),
    monthly: z.array(YearlyMonth),
    byCategory: z.array(Category),
  });
  export type YearlyResponse = z.infer<typeof YearlyResponse>;
}
