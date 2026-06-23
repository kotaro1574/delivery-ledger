import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);
const amountSchema = z.number().int().min(1);
const optionalPositiveInt = z.number().int().min(1).optional();

export namespace EntriesModel {
  export const CreateRequest = z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("income"),
      date: dateSchema,
      amount: amountSchema,
      deliveries: optionalPositiveInt,
      onlineMinutes: optionalPositiveInt,
      memo: z.string().trim().min(1).max(120).optional(),
    }),
    z.object({
      kind: z.literal("expense"),
      date: dateSchema,
      amount: amountSchema,
      categoryCode: z.string().regex(/^\d{3}$/),
      receiptKey: z.string().trim().min(1).max(300).optional(),
      memo: z.string().trim().min(1).max(120).optional(),
    }),
  ]);
  export type CreateRequest = z.infer<typeof CreateRequest>;

  export const UpdateRequest = CreateRequest;
  export type UpdateRequest = z.infer<typeof UpdateRequest>;

  export const MonthQuery = z.object({
    month: monthSchema,
  });
  export type MonthQuery = z.infer<typeof MonthQuery>;

  export const CreateResponse = z.object({
    id: z.string(),
  });
  export type CreateResponse = z.infer<typeof CreateResponse>;

  export const UpdateResponse = z.object({
    id: z.string(),
  });
  export type UpdateResponse = z.infer<typeof UpdateResponse>;

  export const DeleteResponse = z.object({
    id: z.string(),
  });
  export type DeleteResponse = z.infer<typeof DeleteResponse>;

  export const Item = z.object({
    id: z.string(),
    date: dateSchema,
    kind: z.enum(["income", "expense"]),
    category: z.string(),
    categoryCode: z.string(),
    description: z.string(),
    amount: z.number(),
    deliveries: z.number().nullable(),
    onlineMinutes: z.number().nullable(),
    receiptKey: z.string().nullable(),
    businessAmount: z.number().nullable(),
    privateAmount: z.number().nullable(),
  });
  export type Item = z.infer<typeof Item>;

  export const ListResponse = z.object({
    items: z.array(Item),
  });
  export type ListResponse = z.infer<typeof ListResponse>;
}
