"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertDialog } from "radix-ui";
import { CommandMenu } from "@/components/game/command-menu";
import { Button } from "@/components/ui/button";
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
            <AlertDialog.Root>
              <AlertDialog.Trigger asChild>
                <button
                  className="group inline-flex h-9 items-center gap-1 rounded-[2px] px-2 text-sm text-[var(--game-sub)] outline-none hover:text-[var(--game-gold)] focus-visible:ring-2 focus-visible:ring-[var(--game-gold)]"
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
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
                <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[4px] border-[3px] border-[var(--game-line)] bg-[var(--game-bg)] p-5 shadow-[0_0_0_3px_var(--game-bg)]">
                  <AlertDialog.Title className="text-lg text-[var(--game-gold)]">
                    ほんとうに ログアウトする？
                  </AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-sm text-[var(--game-sub)]">
                    きろくは ぜんぶ セーブされてるよ
                  </AlertDialog.Description>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <AlertDialog.Cancel asChild>
                      <Button className="h-11" variant="game">
                        いいえ
                      </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                      <Button
                        className="h-11"
                        onClick={handleSignOut}
                        variant="game"
                      >
                        はい
                      </Button>
                    </AlertDialog.Action>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </CommandMenu>
        </header>
        {children}
      </div>
    </div>
  );
}
