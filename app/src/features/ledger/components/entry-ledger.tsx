"use client";

import type { EntriesModel } from "@server/modules/entries/model";
import {
  Calendar as CalendarIcon,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ja } from "react-day-picker/locale";
import { toast } from "sonner";
import { GameWindow } from "@/components/game/game-window";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { expenseCategories } from "@/features/entries/utils/journal-preview";
import { yen } from "@/features/motivation/utils/yen";
import { formatDateLabel, formatDateString, parseDateString } from "@/lib/date";
import { cn } from "@/lib/utils";

type EditForm = {
  date: string;
  amount: string;
  deliveries: string;
  onlineHours: string;
  onlineMinutes: string;
  memo: string;
  categoryCode: string;
  receiptKey: string;
};

function displayEntryDate(date: string) {
  const parsed = parseDateString(date);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[parsed.getDay()];

  return `${parsed.getMonth() + 1}/${parsed.getDate()}(${weekday})`;
}

function numberOnly(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function minuteOnly(value: string) {
  const sanitized = numberOnly(value);

  if (!sanitized) {
    return "";
  }

  return String(Math.min(Number.parseInt(sanitized, 10), 59));
}

function splitMinutes(value: number | null) {
  const total = value ?? 0;
  return {
    hours: total > 0 ? String(Math.floor(total / 60)) : "",
    minutes: total > 0 ? String(total % 60) : "",
  };
}

function initialEditForm(entry: EntriesModel.Item): EditForm {
  const online = splitMinutes(entry.onlineMinutes);

  return {
    date: entry.date,
    amount: String(entry.amount),
    deliveries: entry.deliveries ? String(entry.deliveries) : "",
    onlineHours: online.hours,
    onlineMinutes: online.minutes,
    memo: entry.description,
    categoryCode: entry.categoryCode,
    receiptKey: entry.receiptKey ?? "",
  };
}

function formOnlineMinutes(form: EditForm) {
  return (
    Number.parseInt(form.onlineHours || "0", 10) * 60 +
    Number.parseInt(form.onlineMinutes || "0", 10)
  );
}

function receiptImageUrl(receiptKey: string) {
  return `/api/receipts/view?key=${encodeURIComponent(receiptKey)}`;
}

export function EntryLedger({
  title,
  entries,
  emptyText,
}: {
  title: string;
  entries: EntriesModel.Item[];
  emptyText: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<EntriesModel.Item | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [confirmingDelete, setConfirmingDelete] =
    useState<EntriesModel.Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const openEdit = (entry: EntriesModel.Item) => {
    setEditing(entry);
    setForm(initialEditForm(entry));
    setDateOpen(false);
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(null);
    setDateOpen(false);
  };

  const updateForm = (patch: Partial<EditForm>) => {
    setForm((value) => (value ? { ...value, ...patch } : value));
  };

  const handleUpdate = async () => {
    if (!editing || !form || saving) {
      return;
    }

    const amount = Number.parseInt(form.amount || "0", 10);

    if (!amount) {
      return;
    }

    setSaving(true);

    try {
      const body =
        editing.kind === "income"
          ? {
              kind: "income",
              date: form.date,
              amount,
              deliveries: form.deliveries
                ? Number.parseInt(form.deliveries, 10)
                : undefined,
              onlineMinutes:
                formOnlineMinutes(form) > 0
                  ? formOnlineMinutes(form)
                  : undefined,
              memo: form.memo.trim() || undefined,
            }
          : {
              kind: "expense",
              date: form.date,
              amount,
              categoryCode: form.categoryCode,
              receiptKey: form.receiptKey.trim() || undefined,
              memo: form.memo.trim() || undefined,
            };
      const response = await fetch(`/api/entries/${editing.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("かきかえられなかった…");
      }

      toast.success("かきかえた！");
      closeEdit();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "かきかえられなかった…",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmingDelete || deleting) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/entries/${confirmingDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("けせなかった…");
      }

      toast.success("けした");
      setConfirmingDelete(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "けせなかった…");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <GameWindow className="px-0 pb-1" title={title}>
        <div>
          {entries.length > 0 ? (
            entries.map((entry) => (
              <div
                className="grid grid-cols-[4.75rem_minmax(0,1fr)_auto_auto] items-center gap-3 border-b-2 border-dashed border-[var(--game-line)]/25 px-4 py-3 last:border-b-0"
                key={entry.id}
              >
                <span className="font-mono text-sm font-bold text-[var(--game-sub)]">
                  {displayEntryDate(entry.date)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm">
                    {entry.description}
                  </span>
                  <span className="block text-xs tracking-wide text-[var(--game-sub)]">
                    {entry.receiptKey
                      ? `${entry.category} · レシートあり`
                      : entry.category}
                  </span>
                  {entry.kind === "expense" &&
                  entry.businessAmount !== null &&
                  entry.privateAmount !== null &&
                  entry.privateAmount > 0 ? (
                    <span className="mt-1 block font-mono text-xs text-[var(--game-sub)]">
                      事業分 {yen(entry.businessAmount)} / 私用分{" "}
                      {yen(entry.privateAmount)}
                    </span>
                  ) : null}
                </span>
                <span
                  className={
                    entry.kind === "income"
                      ? "font-mono text-sm font-bold text-[var(--game-income)]"
                      : "font-mono text-sm font-bold text-[var(--game-expense)]"
                  }
                >
                  {entry.kind === "income" ? "+" : "-"}
                  {yen(entry.amount).slice(1)}
                </span>
                <span className="flex items-center justify-end gap-1">
                  <button
                    aria-label={`なおす ${entry.description}`}
                    className="grid size-8 place-items-center rounded-[4px] border-2 border-[var(--game-line)] bg-transparent transition hover:bg-accent"
                    onClick={() => openEdit(entry)}
                    type="button"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    aria-label={`けす ${entry.description}`}
                    className="grid size-8 place-items-center rounded-[4px] border-2 border-[var(--game-line)] bg-transparent text-[var(--game-expense)] transition hover:bg-accent"
                    onClick={() => setConfirmingDelete(entry)}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-[var(--game-sub)]">
              {emptyText}
            </div>
          )}
        </div>
      </GameWindow>

      {editing && form ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <Card
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto p-5"
            role="dialog"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="text-xl">とりひきを なおす</div>
                <div className="mt-1 text-xs tracking-[0.18em] text-[var(--game-sub)]">
                  {editing.kind === "income" ? "しゅうにゅう" : "けいひ"} ·{" "}
                  {editing.category}
                </div>
              </div>
              <button
                aria-label="とじる"
                className="grid size-8 place-items-center rounded-[4px] border-2 border-[var(--game-line)] bg-transparent transition hover:bg-accent"
                onClick={closeEdit}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="mb-2 block text-xs tracking-widest text-[var(--game-sub)]"
                  htmlFor="edit-date"
                >
                  はたらいた ひ
                </label>
                <Popover onOpenChange={setDateOpen} open={dateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className="w-full justify-start border-2 bg-transparent font-mono font-normal"
                      id="edit-date"
                      type="button"
                      variant="outline"
                    >
                      <CalendarIcon className="size-4 text-[var(--game-sub)]" />
                      {formatDateLabel(form.date)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      defaultMonth={parseDateString(form.date)}
                      disabled={{ after: new Date() }}
                      locale={ja}
                      mode="single"
                      onSelect={(date) => {
                        if (date) {
                          updateForm({ date: formatDateString(date) });
                        }
                        setDateOpen(false);
                      }}
                      selected={parseDateString(form.date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label
                  className="mb-2 block text-xs tracking-widest text-[var(--game-sub)]"
                  htmlFor="edit-amount"
                >
                  {editing.kind === "income" ? "うりあげ" : "きんがく"}
                </label>
                <div className="flex items-baseline gap-2 border-b-2 border-border px-1 pb-3">
                  <span className="font-mono text-2xl text-[var(--game-sub)]">
                    ¥
                  </span>
                  <input
                    className="w-full bg-transparent font-mono text-4xl font-bold text-[var(--game-gold)] outline-none placeholder:text-[var(--game-sub)]/50"
                    id="edit-amount"
                    inputMode="numeric"
                    onChange={(event) =>
                      updateForm({ amount: numberOnly(event.target.value) })
                    }
                    placeholder="0"
                    value={
                      form.amount
                        ? Number(form.amount).toLocaleString("ja-JP")
                        : ""
                    }
                  />
                </div>
              </div>

              {editing.kind === "income" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="mb-1 block text-xs text-[var(--game-sub)]"
                      htmlFor="edit-deliveries"
                    >
                      けんすう
                    </label>
                    <div className="flex h-12 items-center rounded-[4px] border-2 border-[var(--game-line)] bg-transparent px-3 py-2">
                      <Input
                        className="h-auto min-w-0 border-0 bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
                        id="edit-deliveries"
                        inputMode="numeric"
                        onChange={(event) =>
                          updateForm({
                            deliveries: numberOnly(event.target.value),
                          })
                        }
                        placeholder="0"
                        value={form.deliveries}
                      />
                      <span className="shrink-0 whitespace-nowrap text-xs text-[var(--game-sub)]">
                        件
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-[var(--game-sub)]">
                      オンライン じかん
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className="flex h-12 items-center rounded-[4px] border-2 border-[var(--game-line)] bg-transparent px-3 py-2"
                        htmlFor="edit-online-hours"
                      >
                        <Input
                          className="h-auto min-w-0 border-0 bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
                          id="edit-online-hours"
                          inputMode="numeric"
                          onChange={(event) =>
                            updateForm({
                              onlineHours: numberOnly(event.target.value),
                            })
                          }
                          placeholder="0"
                          value={form.onlineHours}
                        />
                        <span className="shrink-0 whitespace-nowrap text-xs text-[var(--game-sub)]">
                          時間
                        </span>
                      </label>
                      <label
                        className="flex h-12 items-center rounded-[4px] border-2 border-[var(--game-line)] bg-transparent px-3 py-2"
                        htmlFor="edit-online-minutes"
                      >
                        <Input
                          className="h-auto min-w-0 border-0 bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
                          id="edit-online-minutes"
                          inputMode="numeric"
                          maxLength={2}
                          onChange={(event) =>
                            updateForm({
                              onlineMinutes: minuteOnly(event.target.value),
                            })
                          }
                          placeholder="0"
                          value={form.onlineMinutes}
                        />
                        <span className="shrink-0 whitespace-nowrap text-xs text-[var(--game-sub)]">
                          分
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-2 text-xs tracking-widest text-[var(--game-sub)]">
                    カテゴリ
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {expenseCategories.map((category) => (
                      <button
                        className={cn(
                          "rounded-[4px] border-2 border-[var(--game-line)] bg-transparent px-3 py-2 text-sm font-bold transition hover:bg-accent",
                          form.categoryCode === category.code &&
                            "border-[var(--game-gold)] text-[var(--game-gold)]",
                        )}
                        key={category.code}
                        onClick={() =>
                          updateForm({ categoryCode: category.code })
                        }
                        type="button"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editing.kind === "expense" && form.receiptKey ? (
                <div>
                  <div className="mb-2 text-xs tracking-widest text-[var(--game-sub)]">
                    レシート画像
                  </div>
                  <div className="flex justify-center overflow-hidden rounded-[4px] border-2 border-[var(--game-line)] bg-transparent p-3">
                    <Image
                      alt={`${editing.description}のレシート画像`}
                      className="h-auto max-h-72 w-auto max-w-full object-contain"
                      height={1280}
                      sizes="(max-width: 768px) 100vw, 36rem"
                      src={receiptImageUrl(form.receiptKey)}
                      unoptimized
                      width={960}
                    />
                  </div>
                </div>
              ) : null}

              <Textarea
                className="bg-background"
                onChange={(event) => updateForm({ memo: event.target.value })}
                placeholder="メモ（なくても OK）"
                value={form.memo}
              />

              <Button
                className="h-11 w-full tracking-widest"
                disabled={!Number.parseInt(form.amount || "0", 10) || saving}
                onClick={handleUpdate}
                type="button"
                variant="gamePrimary"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                かきかえる
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {confirmingDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <Card aria-modal="true" className="w-full max-w-sm p-5" role="dialog">
            <div className="text-xl">とりひきを けす</div>
            <div className="mt-2 text-sm text-[var(--game-sub)]">
              {confirmingDelete.description} を けす？
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                disabled={deleting}
                onClick={() => setConfirmingDelete(null)}
                type="button"
                variant="game"
              >
                やめる
              </Button>
              <Button
                className="rounded-[4px] border-2 border-[var(--game-line)] bg-[var(--game-expense)] text-[var(--game-bg)] hover:bg-[var(--game-expense)]/90"
                disabled={deleting}
                onClick={handleDelete}
                type="button"
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
                けす
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
