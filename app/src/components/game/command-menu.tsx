import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CommandMenu({
  items,
  activeHref,
  className,
  children,
}: {
  items: { href: string; label: string }[];
  activeHref: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <nav
      className={cn(
        "flex flex-wrap items-center gap-x-1 gap-y-1 rounded-[4px] border-[3px] border-[var(--game-line)] bg-[var(--game-bg)] px-2 py-1 shadow-[0_0_0_3px_var(--game-bg)]",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.href === activeHref;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "group inline-flex h-9 items-center gap-1 rounded-[2px] px-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--game-gold)]",
              active
                ? "text-[var(--game-gold)]"
                : "text-[var(--game-line)] hover:text-[var(--game-gold)]",
            )}
            href={item.href}
            key={item.href}
          >
            <span
              aria-hidden="true"
              className={cn(
                "w-3 text-xs",
                active
                  ? "motion-safe:animate-[cursor-blink_1s_steps(2,jump-none)_infinite]"
                  : "invisible group-hover:visible group-focus-visible:visible",
              )}
            >
              ▶
            </span>
            {item.label}
          </Link>
        );
      })}
      {children}
    </nav>
  );
}
