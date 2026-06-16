import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("メールアドレスを入れて"),
  password: z.string().min(8, "8文字以上で入れて"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = loginSchema.extend({
  name: z.string().trim().min(1, "名前を入れて").max(80, "名前が長すぎる"),
});

export type SignupInput = z.infer<typeof signupSchema>;
