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
        throw new Error("目標の保存に失敗した");
      }

      toast.success(targetAmount > 0 ? "目標をセットした" : "目標を外した");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "目標の保存に失敗した",
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
            aria-label="目標を編集"
            className="grid size-8 place-items-center rounded-lg border border-border bg-background transition hover:bg-accent"
            type="button"
          >
            <Pencil className="size-4" />
          </button>
        ) : (
          <Button
            className="h-11 w-full border-2 border-dashed border-[var(--ledger-gold)]/60 bg-[var(--ledger-gold-soft)] font-bold tracking-wider text-[var(--ledger-gold-ink)] hover:bg-[var(--ledger-gold-soft)]/70"
            type="button"
            variant="outline"
          >
            {emptyLabel}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 bg-card">
        <label
          className="mb-2 block text-xs tracking-widest text-muted-foreground"
          htmlFor={`goal-${month}`}
        >
          目標金額
        </label>
        <div className="flex items-baseline gap-2 border-b-2 border-border px-1 pb-2">
          <span className="text-xl text-muted-foreground">¥</span>
          <input
            className="w-full bg-transparent font-mono text-3xl font-bold outline-none placeholder:text-[#cfc7b4]"
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
        <div className="mt-2 text-xs text-muted-foreground">
          空にして保存すると目標を外す
        </div>
        <Button
          className="mt-4 h-10 w-full font-bold tracking-widest"
          disabled={saving}
          onClick={handleSave}
          type="button"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          目標を保存
        </Button>
      </PopoverContent>
    </Popover>
  );
}
