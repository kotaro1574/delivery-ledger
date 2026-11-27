"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CommandMenu } from "@/components/game/command-menu";
import { signOut } from "@/lib/auth/client";

const navItems = [
  { href: "/", label: "だいちょう" },
  { href: "/year", label: "ねんかん" },
  { href: "/input", label: "きろくする" },
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
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="text-xl tracking-wider sm:text-2xl" href="/">
              はいたつ しゅうし だいちょう
            </Link>
            <div className="mt-1 text-xs tracking-[0.18em] text-[var(--game-sub)]">
              UBER DELIVERY · 青色申告対応
              <span className="ml-2 hidden sm:inline">{userName}</span>
            </div>
          </div>
          <CommandMenu activeHref={pathname} items={navItems}>
            <button
              aria-label="ログアウト"
              className="group inline-flex h-9 items-center gap-1 rounded-[2px] px-2 text-sm text-[var(--game-sub)] outline-none hover:text-[var(--game-gold)] focus-visible:ring-2 focus-visible:ring-[var(--game-gold)]"
              onClick={handleSignOut}
              type="button"
            >
              <span
                aria-hidden="true"
                className="invisible w-3 text-xs group-hover:visible group-focus-visible:visible"
              >
                ▶
              </span>
              ログアウト
            </button>
          </CommandMenu>
        </header>
        {children}
      </div>
    </div>
  );
}
