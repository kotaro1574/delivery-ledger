import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GameWindow({
  title,
  className,
  children,
  as: Tag = "section",
}: {
  title?: string;
  className?: string;
  children: ReactNode;
  as?: "section" | "div";
}) {
  return (
    <Tag
      aria-label={title}
      className={cn(
        "relative rounded-[4px] border-[3px] border-[var(--game-line)] bg-[var(--game-bg)] text-[var(--game-line)] shadow-[0_0_0_3px_var(--game-bg)]",
        title ? "mt-3 px-4 pt-5 pb-4" : "p-4",
        className,
      )}
    >
      {title ? (
        <div
          aria-hidden="true"
          className="absolute -top-3 left-3 bg-[var(--game-bg)] px-2 text-sm leading-6 tracking-widest"
        >
          {title}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}
