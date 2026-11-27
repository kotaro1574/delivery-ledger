"use client";

import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function digits(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 9);
}

export function GoalEditor({
  month,
  goal,
  emptyLabel,
}: {
  month: string;
  goal: number | null;
  emptyLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(goal ? String(goal) : "");
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setValue(goal ? String(goal) : "");
    }
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    const targetAmount = Number.parseInt(value || "0", 10);
    setSaving(true);

    try {
      const response = await fetch(`/api/goals/${month}`, {
        method: targetAmount > 0 ? "PUT" : "DELETE",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: targetAmount > 0 ? JSON.stringify({ targetAmount }) : undefined,
      });

      if (!response.ok) {
        throw new Error("もくひょうを セーブできなかった…");
      }

      toast.success(
        targetAmount > 0
          ? "もくひょうを セットした！"
          : "もくひょうを はずした",
      );
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "もくひょうを セーブできなかった…",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <PopoverTrigger asChild>
        {goal ? (
          <button
            aria-label="もくひょうを かえる"
            className="grid size-9 place-items-center rounded-[4px] border-2 border-[var(--game-line)] bg-[var(--game-bg)] transition hover:text-[var(--game-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-gold)]"
            type="button"
          >
            <Pencil className="size-4" />
          </button>
        ) : (
          <Button
            className="h-11 w-full tracking-wider"
            type="button"
            variant="game"
          >
            {emptyLabel}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <label
          className="mb-2 block text-xs tracking-widest text-[var(--game-sub)]"
          htmlFor={`goal-${month}`}
        >
          もくひょうきんがく
        </label>
        <div className="flex items-baseline gap-2 border-b-2 border-border px-1 pb-2">
          <span className="font-mono text-xl text-[var(--game-sub)]">¥</span>
          <input
            className="w-full bg-transparent font-mono text-3xl font-bold text-[var(--game-gold)] outline-none placeholder:text-[var(--game-sub)]/50"
            id={`goal-${month}`}
            inputMode="numeric"
            onChange={(event) => setValue(digits(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSave();
              }
            }}
            placeholder="300,000"
            value={value ? Number(value).toLocaleString("ja-JP") : ""}
          />
        </div>
        <div className="mt-2 text-xs text-[var(--game-sub)]">
          からっぽで セーブすると もくひょうを はずす
        </div>
        <Button
          className="mt-4 h-10 w-full tracking-widest"
          disabled={saving}
          onClick={handleSave}
          type="button"
          variant="gamePrimary"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          もくひょうを セーブ
        </Button>
      </PopoverContent>
    </Popover>
  );
}
