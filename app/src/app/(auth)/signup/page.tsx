"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth/client";
import { type SignupInput, signupSchema } from "@/lib/validation/auth";

export default function SignupPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const handleSubmit = async (data: SignupInput) => {
    setError("");
    setLoading(true);

    try {
      const result = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        setError(result.error.message ?? "アカウントを つくれなかった…");
        setLoading(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setError("アカウントを つくれなかった…");
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>あたらしく はじめる</CardTitle>
        <CardDescription>じぶん だけの だいちょうを つくる</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-[4px] border-2 border-[var(--game-expense)] p-3 text-sm text-[var(--game-expense)]">
                {error}
              </div>
            ) : null}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>なまえ</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>パスワード</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col gap-3 pt-6">
            <Button
              className="h-11 w-full tracking-widest"
              disabled={loading}
              type="submit"
              variant="gamePrimary"
            >
              {loading ? "つくってる…" : "つくる"}
            </Button>
            <Link
              className="inline-flex h-9 items-center text-sm text-[var(--game-sub)] hover:text-[var(--game-gold)]"
              href="/login"
            >
              ログインへ もどる
            </Link>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
