"use client";

import { BarChart3, BookOpen, LogOut, PenLine } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "台帳", icon: BookOpen },
  { href: "/year", label: "年次", icon: BarChart3 },
  { href: "/input", label: "入力", icon: PenLine },
];

export function AppShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen px-4 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/"
              className="font-serif text-2xl font-bold tracking-wide"
            >
              配達収支台帳
            </Link>
            <div className="mt-1 text-xs tracking-[0.18em] text-muted-foreground">
              UBER DELIVERY · 青色申告対応
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              {userName}
            </div>
            <nav className="flex rounded-xl border border-border bg-card p-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-muted-foreground transition",
                      active && "bg-background text-foreground shadow-sm",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Button
              aria-label="ログアウト"
              variant="outline"
              size="icon"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
