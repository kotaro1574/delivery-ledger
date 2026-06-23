"use client";

import type { EntriesModel } from "@server/modules/entries/model";
import type { SummaryModel } from "@server/modules/summary/model";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { expenseCategories } from "@/features/entries/utils/journal-preview";
import { DailyTrendCard } from "@/features/ledger/components/daily-trend-card";
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

function yen(value: number) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

function displayMonth(month: string) {
  const [year, rawMonth] = month.split("-");
  return `${year}年${Number(rawMonth)}月`;
}

function moveMonth(month: string, offset: number) {
  const [year, rawMonth] = month.split("-").map(Number);
  const date = new Date(year, rawMonth - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

export function LedgerDashboard({
  month,
  summary,
  entries,
}: {
  month: string;
  summary: SummaryModel.Response;
  entries: EntriesModel.Item[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<EntriesModel.Item | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [confirmingDelete, setConfirmingDelete] =
    useState<EntriesModel.Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const maxCategory = Math.max(
    1,
    ...summary.byCategory.map((item) => item.amount),
  );
  const privateExpense = Math.max(0, summary.paidExpense - summary.expense);
  const showExpenseBreakdown = summary.paidExpense > 0 && privateExpense > 0;

  const openEdit = (entry: EntriesModel.Item) => {
    setEditing(entry);
    setForm(initialEditForm(entry));
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(null);
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
        throw new Error("更新に失敗した");
      }

      toast.success("更新した");
      closeEdit();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新に失敗した");
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
        throw new Error("削除に失敗した");
      }

      toast.success("削除した");
      setConfirmingDelete(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "削除に失敗した");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-bold tracking-[0.2em] text-muted-foreground">
          MONTHLY LEDGER
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/?month=${moveMonth(month, -1)}`}
            aria-label="前の月"
            className="grid size-9 place-items-center rounded-lg border border-border bg-card transition hover:bg-accent"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div className="min-w-28 text-center font-mono text-base font-bold">
            {displayMonth(month)}
          </div>
          <Link
            href={`/?month=${moveMonth(month, 1)}`}
            aria-label="次の月"
            className="grid size-9 place-items-center rounded-lg border border-border bg-card transition hover:bg-accent"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <section className="grid overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        <div className="bg-card p-5">
          <div className="mb-2 text-xs tracking-widest text-muted-foreground">
            売上（収入）
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--ledger-income)]">
            {yen(summary.revenue)}
          </div>
        </div>
        <div className="bg-card p-5">
          <div className="mb-2 text-xs tracking-widest text-muted-foreground">
            経費（事業分）
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--ledger-expense)]">
            {yen(summary.expense)}
          </div>
          {showExpenseBreakdown ? (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-muted-foreground">
              <span>支払総額 {yen(summary.paidExpense)}</span>
              <span>私用分 {yen(privateExpense)}</span>
            </div>
          ) : null}
        </div>
        <div className="bg-[#fffdf7] p-5">
          <div className="mb-2 text-xs tracking-widest text-muted-foreground">
            差引利益
          </div>
          <div className="font-mono text-3xl font-bold">
            {yen(summary.profit)}
          </div>
        </div>
      </section>

      <DailyTrendCard entries={entries} month={month} />

      <section>
        <div className="mb-3 text-sm font-bold tracking-[0.2em] text-muted-foreground">
          経費内訳（事業分）
        </div>
        <Card className="overflow-hidden border-border bg-card p-0">
          {summary.byCategory.length > 0 ? (
            summary.byCategory.map((item) => (
              <div
                className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
                key={item.code}
              >
                <span className="text-sm font-bold">{item.name}</span>
                <span className="relative h-1.5 overflow-hidden rounded-full bg-[rgb(168_84_58_/_16%)]">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-[var(--ledger-expense)] opacity-75"
                    style={{ width: `${(item.amount / maxCategory) * 100}%` }}
                  />
                </span>
                <span className="font-mono text-sm font-bold text-[var(--ledger-expense)]">
                  {yen(item.amount)}
                </span>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              この月の経費はありません
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Card className="border-border bg-[#fffdf7] p-5">
          <div className="mb-2 text-xs tracking-widest text-muted-foreground">
            平均時給
          </div>
          <div className="font-mono text-2xl font-bold">
            {yen(summary.metrics.wagePerHour)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            オンライン {summary.metrics.onlineHours}時間
          </div>
        </Card>
        <Card className="border-border bg-[#fffdf7] p-5">
          <div className="mb-2 text-xs tracking-widest text-muted-foreground">
            1件あたり
          </div>
          <div className="font-mono text-2xl font-bold">
            {yen(summary.metrics.perDelivery)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {summary.metrics.deliveries}件
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-3 text-sm font-bold tracking-[0.2em] text-muted-foreground">
          日々の取引
        </div>
        <Card className="overflow-hidden border-border bg-card p-0">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <div
                className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
                key={entry.id}
              >
                <span className="font-mono text-sm font-bold text-muted-foreground">
                  {entry.date.slice(5).replace("-", "/")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">
                    {entry.description}
                  </span>
                  <span className="block text-xs tracking-wide text-muted-foreground">
                    {entry.category}
                  </span>
                  {entry.kind === "expense" &&
                  entry.businessAmount !== null &&
                  entry.privateAmount !== null &&
                  entry.privateAmount > 0 ? (
                    <span className="mt-1 block text-xs font-bold text-muted-foreground">
                      事業分 {yen(entry.businessAmount)} / 私用分{" "}
                      {yen(entry.privateAmount)}
                    </span>
                  ) : null}
                </span>
                <span
                  className={
                    entry.kind === "income"
                      ? "font-mono text-sm font-bold text-[var(--ledger-income)]"
                      : "font-mono text-sm font-bold text-[var(--ledger-expense)]"
                  }
                >
                  {entry.kind === "income" ? "+" : "-"}
                  {yen(entry.amount).slice(1)}
                </span>
                <span className="flex items-center justify-end gap-1">
                  <button
                    aria-label={`編集 ${entry.description}`}
                    className="grid size-8 place-items-center rounded-lg border border-border bg-background transition hover:bg-accent"
                    onClick={() => openEdit(entry)}
                    type="button"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    aria-label={`削除 ${entry.description}`}
                    className="grid size-8 place-items-center rounded-lg border border-border bg-background text-[var(--ledger-expense)] transition hover:bg-accent"
                    onClick={() => setConfirmingDelete(entry)}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </span>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              この月の取引はありません
            </div>
          )}
        </Card>
      </section>

      {editing && form ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <Card
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto border-border bg-card p-5"
            role="dialog"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="font-serif text-xl font-bold">取引編集</div>
                <div className="mt-1 text-xs tracking-[0.18em] text-muted-foreground">
                  {editing.kind === "income" ? "収入" : "経費"} ·{" "}
                  {editing.category}
                </div>
              </div>
              <button
                aria-label="閉じる"
                className="grid size-8 place-items-center rounded-lg border border-border bg-background transition hover:bg-accent"
                onClick={closeEdit}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="mb-2 block text-xs tracking-widest text-muted-foreground"
                  htmlFor="edit-date"
                >
                  稼働日
                </label>
                <Input
                  className="bg-background font-mono"
                  id="edit-date"
                  onChange={(event) => updateForm({ date: event.target.value })}
                  type="date"
                  value={form.date}
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-xs tracking-widest text-muted-foreground"
                  htmlFor="edit-amount"
                >
                  {editing.kind === "income" ? "売上" : "金額"}
                </label>
                <div className="flex items-baseline gap-2 border-b-2 border-border px-1 pb-3">
                  <span className="text-2xl text-muted-foreground">¥</span>
                  <input
                    className="w-full bg-transparent font-mono text-4xl font-bold outline-none placeholder:text-[#cfc7b4]"
                    id="edit-amount"
                    inputMode="numeric"
                    onChange={(event) =>
                      updateForm({ amount: numberOnly(event.target.value) })
                    }
                    placeholder="0"
                    value={form.amount}
                  />
                </div>
              </div>

              {editing.kind === "income" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="mb-1 block text-xs text-muted-foreground"
                      htmlFor="edit-deliveries"
                    >
                      件数
                    </label>
                    <div className="flex items-baseline rounded-lg border border-border bg-background px-3 py-2">
                      <Input
                        className="h-auto border-0 bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
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
                      <span className="text-xs text-muted-foreground">件</span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">
                      オンライン時間
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className="flex items-baseline rounded-lg border border-border bg-background px-3 py-2"
                        htmlFor="edit-online-hours"
                      >
                        <Input
                          className="h-auto border-0 bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
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
                        <span className="text-xs text-muted-foreground">
                          時間
                        </span>
                      </label>
                      <label
                        className="flex items-baseline rounded-lg border border-border bg-background px-3 py-2"
                        htmlFor="edit-online-minutes"
                      >
                        <Input
                          className="h-auto border-0 bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
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
                        <span className="text-xs text-muted-foreground">
                          分
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-2 text-xs tracking-widest text-muted-foreground">
                    カテゴリ
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {expenseCategories.map((category) => (
                      <button
                        className={cn(
                          "rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold transition hover:bg-accent",
                          form.categoryCode === category.code &&
                            "border-primary bg-primary text-primary-foreground",
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

              <Textarea
                className="bg-background"
                onChange={(event) => updateForm({ memo: event.target.value })}
                placeholder="メモ（任意）"
                value={form.memo}
              />

              <Button
                className="h-11 w-full font-bold tracking-widest"
                disabled={!Number.parseInt(form.amount || "0", 10) || saving}
                onClick={handleUpdate}
                type="button"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                更新する
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {confirmingDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <Card
            aria-modal="true"
            className="w-full max-w-sm border-border bg-card p-5"
            role="dialog"
          >
            <div className="font-serif text-xl font-bold">取引を削除</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {confirmingDelete.description} を削除する
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                disabled={deleting}
                onClick={() => setConfirmingDelete(null)}
                type="button"
                variant="outline"
              >
                キャンセル
              </Button>
              <Button
                className="bg-[var(--ledger-expense)] hover:bg-[var(--ledger-expense)]/90"
                disabled={deleting}
                onClick={handleDelete}
                type="button"
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
                削除する
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
