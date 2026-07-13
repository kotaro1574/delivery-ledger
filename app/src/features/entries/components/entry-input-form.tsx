"use client";

import {
  Calendar as CalendarIcon,
  Camera,
  Check,
  ChevronDown,
  Loader2,
  ScanText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ja } from "react-day-picker/locale";
import { toast } from "sonner";
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
import {
  formatDateLabel,
  formatDateString,
  parseDateString,
  todayString,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  buildJournalPreview,
  type EntryMode,
  expenseCategories,
} from "../utils/journal-preview";

type RecentEntry = {
  id: string;
  mode: EntryMode;
  label: string;
  amount: number;
  memo: string;
  sub: string;
  date: string;
};

type ReceiptOcrResponse = {
  amount: number | null;
  date: string | null;
  storeName: string | null;
  categoryCode: string;
  memo: string;
  confidence: number;
};

function yen(value: number) {
  return `¥${Math.round(Number(value || 0)).toLocaleString("ja-JP")}`;
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

async function uploadReceipt(file: File): Promise<string> {
  const response = await fetch("/api/receipts/upload-url", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contentType: file.type }),
  });

  if (!response.ok) {
    throw new Error("レシートURLの発行に失敗した");
  }

  const result = (await response.json()) as { url: string; key: string };
  const uploadResponse = await fetch(result.url, {
    method: "PUT",
    credentials: result.url.startsWith("/api/") ? "include" : "omit",
    headers: { "content-type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("レシートのアップロードに失敗した");
  }

  return result.key;
}

async function analyzeReceipt(file: File): Promise<ReceiptOcrResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/receipts/analyze", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(result?.message ?? "レシートの解析に失敗した");
  }

  return response.json() as Promise<ReceiptOcrResponse>;
}

function isExpenseCategoryCode(value: string): boolean {
  return expenseCategories.some((category) => category.code === value);
}

export function EntryInputForm() {
  const router = useRouter();
  const [mode, setMode] = useState<EntryMode>("income");
  const [entryDate, setEntryDate] = useState(() => todayString());
  const [dateOpen, setDateOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [categoryCode, setCategoryCode] = useState("601");
  const [deliveries, setDeliveries] = useState("");
  const [onlineHours, setOnlineHours] = useState("");
  const [onlineMinutes, setOnlineMinutes] = useState("");
  const [memo, setMemo] = useState("");
  const [showJournal, setShowJournal] = useState(false);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzingReceipt, setAnalyzingReceipt] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const dateLabel = formatDateLabel(entryDate);
  const amountNumber = Number.parseInt(amount || "0", 10);
  const selectedCategory =
    expenseCategories.find((category) => category.code === categoryCode) ??
    expenseCategories[0];
  const deliveryCount = Number.parseInt(deliveries || "0", 10);
  const totalOnlineMinutes =
    Number.parseInt(onlineHours || "0", 10) * 60 +
    Number.parseInt(onlineMinutes || "0", 10);
  const showStats =
    mode === "income" &&
    amountNumber > 0 &&
    (deliveryCount > 0 || totalOnlineMinutes > 0);
  const wage =
    totalOnlineMinutes > 0
      ? yen(amountNumber / (totalOnlineMinutes / 60))
      : "-";
  const perDelivery =
    deliveryCount > 0 ? yen(amountNumber / deliveryCount) : "-";
  const journal = useMemo(
    () =>
      buildJournalPreview({
        mode,
        amount: amountNumber,
        category: selectedCategory,
      }),
    [amountNumber, mode, selectedCategory],
  );

  const resetForm = () => {
    setAmount("");
    setDeliveries("");
    setOnlineHours("");
    setOnlineMinutes("");
    setMemo("");
    setReceipt(null);
    setSaved(true);
  };

  const selectMode = (nextMode: EntryMode) => {
    setMode(nextMode);
    setSaved(false);

    if (nextMode === "income") {
      setReceipt(null);
    }
  };

  const handleReceiptSelected = async (file: File | null) => {
    if (!file || analyzingReceipt) {
      return;
    }

    setReceipt(file);
    setSaved(false);
    setAnalyzingReceipt(true);

    try {
      const result = await analyzeReceipt(file);

      if (result.amount !== null) {
        setAmount(String(Math.round(result.amount)));
      }

      if (result.date) {
        setEntryDate(result.date);
      }

      if (isExpenseCategoryCode(result.categoryCode)) {
        setCategoryCode(result.categoryCode);
      }

      if (result.memo.trim()) {
        setMemo(result.memo);
      }

      toast.success("レシートを読み取った");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "レシートの解析に失敗した",
      );
    } finally {
      setAnalyzingReceipt(false);
    }
  };

  const handleSave = async () => {
    if (!amountNumber || !entryDate || saving) {
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const receiptKey =
        mode === "expense" && receipt
          ? await uploadReceipt(receipt)
          : undefined;
      const body =
        mode === "income"
          ? {
              kind: "income",
              date: entryDate,
              amount: amountNumber,
              deliveries: deliveryCount > 0 ? deliveryCount : undefined,
              onlineMinutes:
                totalOnlineMinutes > 0 ? totalOnlineMinutes : undefined,
              memo: memo.trim() || undefined,
            }
          : {
              kind: "expense",
              date: entryDate,
              amount: amountNumber,
              categoryCode,
              receiptKey,
              memo: memo.trim() || undefined,
            };
      const response = await fetch("/api/entries", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("保存に失敗した");
      }

      setRecent((items) => [
        {
          id: crypto.randomUUID(),
          mode,
          label: mode === "income" ? "売上" : selectedCategory.name,
          amount: amountNumber,
          memo,
          sub:
            mode === "income"
              ? [
                  deliveryCount > 0 ? `${deliveryCount}件` : null,
                  totalOnlineMinutes > 0 ? `時給${wage}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : receiptKey
                ? "レシートあり"
                : "",
          date: entryDate,
        },
        ...items,
      ]);
      resetForm();
      toast.success("保存した");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存に失敗した");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <div className="font-serif text-2xl font-bold tracking-wide">入力</div>
        <div className="mt-1 text-xs tracking-[0.18em] text-muted-foreground">
          配達収支台帳 · {dateLabel}
        </div>
      </div>

      <Card className="border-border bg-card p-5">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
          <button
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-bold text-muted-foreground transition",
              mode === "income" &&
                "bg-card text-[var(--ledger-income)] shadow-sm",
            )}
            onClick={() => selectMode("income")}
            type="button"
          >
            収入
          </button>
          <button
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-bold text-muted-foreground transition",
              mode === "expense" &&
                "bg-card text-[var(--ledger-expense)] shadow-sm",
            )}
            onClick={() => selectMode("expense")}
            type="button"
          >
            経費
          </button>
        </div>

        <div className="mb-5">
          <label
            className="mb-2 block text-xs tracking-widest text-muted-foreground"
            htmlFor="entry-date"
          >
            稼働日
          </label>
          <Popover onOpenChange={setDateOpen} open={dateOpen}>
            <PopoverTrigger asChild>
              <Button
                className="w-full justify-start bg-background font-mono font-normal"
                id="entry-date"
                type="button"
                variant="outline"
              >
                <CalendarIcon className="size-4 text-muted-foreground" />
                {dateLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                defaultMonth={parseDateString(entryDate)}
                disabled={{ after: new Date() }}
                locale={ja}
                mode="single"
                onSelect={(date) => {
                  if (date) {
                    setEntryDate(formatDateString(date));
                    setSaved(false);
                  }
                  setDateOpen(false);
                }}
                selected={parseDateString(entryDate)}
              />
            </PopoverContent>
          </Popover>
        </div>

        <label
          className="mb-2 block text-xs tracking-widest text-muted-foreground"
          htmlFor="entry-amount"
        >
          {mode === "income" ? "この日の売上" : "金額"}
        </label>
        <div className="mb-5 flex items-baseline gap-2 border-b-2 border-border px-1 pb-3">
          <span className="text-2xl text-muted-foreground">¥</span>
          <input
            className="w-full bg-transparent font-mono text-4xl font-bold outline-none placeholder:text-[#cfc7b4]"
            id="entry-amount"
            inputMode="numeric"
            onChange={(event) => {
              setAmount(numberOnly(event.target.value));
              setSaved(false);
            }}
            placeholder="0"
            value={amount ? Number(amount).toLocaleString("ja-JP") : ""}
          />
        </div>

        {mode === "expense" ? (
          <>
            <div className="mb-2 text-xs tracking-widest text-muted-foreground">
              カテゴリ
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {expenseCategories.map((category) => (
                <button
                  className={cn(
                    "rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold transition hover:bg-accent",
                    categoryCode === category.code &&
                      "border-primary bg-primary text-primary-foreground",
                  )}
                  key={category.code}
                  onClick={() => setCategoryCode(category.code)}
                  type="button"
                >
                  {category.name}
                </button>
              ))}
            </div>
            {selectedCategory.ratio < 100 ? (
              <div className="mb-5 text-xs text-muted-foreground">
                事業割合 {selectedCategory.ratio}%
                を自動適用（私用分は事業主貸へ）
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="mb-2 text-xs tracking-widest text-muted-foreground">
              稼働メモ（任意）
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label
                  className="mb-1 block text-xs text-muted-foreground"
                  htmlFor="entry-deliveries"
                >
                  件数
                </label>
                <div className="flex h-12 items-center rounded-lg border border-border bg-background px-3 py-2">
                  <Input
                    className="h-auto min-w-0 border-0 bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
                    id="entry-deliveries"
                    inputMode="numeric"
                    onChange={(event) =>
                      setDeliveries(numberOnly(event.target.value))
                    }
                    placeholder="0"
                    value={deliveries}
                  />
                  <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                    件
                  </span>
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-muted-foreground">
                  オンライン時間
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className="flex h-12 items-center rounded-lg border border-border bg-background px-3 py-2"
                    htmlFor="entry-online-hours"
                  >
                    <Input
                      className="h-auto min-w-0 border-0 bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
                      id="entry-online-hours"
                      inputMode="numeric"
                      onChange={(event) => {
                        setOnlineHours(numberOnly(event.target.value));
                        setSaved(false);
                      }}
                      placeholder="0"
                      value={onlineHours}
                    />
                    <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                      時間
                    </span>
                  </label>
                  <label
                    className="flex h-12 items-center rounded-lg border border-border bg-background px-3 py-2"
                    htmlFor="entry-online-minutes"
                  >
                    <Input
                      className="h-auto min-w-0 border-0 bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
                      id="entry-online-minutes"
                      inputMode="numeric"
                      maxLength={2}
                      onChange={(event) => {
                        setOnlineMinutes(minuteOnly(event.target.value));
                        setSaved(false);
                      }}
                      placeholder="0"
                      value={onlineMinutes}
                    />
                    <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                      分
                    </span>
                  </label>
                </div>
              </div>
            </div>
            {showStats ? (
              <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-border">
                <div className="bg-[#fffdf7] p-4">
                  <div className="mb-1 text-xs text-muted-foreground">時給</div>
                  <div className="font-mono text-xl font-bold">{wage}</div>
                </div>
                <div className="bg-[#fffdf7] p-4">
                  <div className="mb-1 text-xs text-muted-foreground">
                    1件あたり
                  </div>
                  <div className="font-mono text-xl font-bold">
                    {perDelivery}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}

        {mode === "expense" ? (
          <>
            <input
              accept="image/jpeg,image/png,image/webp,image/gif"
              aria-label="レシート画像"
              className="hidden"
              onChange={(event) =>
                void handleReceiptSelected(event.target.files?.[0] ?? null)
              }
              ref={fileRef}
              type="file"
            />
            <Button
              className="mb-4 w-full border-dashed"
              disabled={analyzingReceipt}
              onClick={() => fileRef.current?.click()}
              type="button"
              variant="outline"
            >
              {analyzingReceipt ? (
                <Loader2 className="size-4 animate-spin" />
              ) : receipt ? (
                <Camera className="size-4" />
              ) : (
                <ScanText className="size-4" />
              )}
              {analyzingReceipt
                ? "読み取り中"
                : receipt
                  ? receipt.name
                  : "レシート画像から読み取る"}
            </Button>
          </>
        ) : null}

        <Textarea
          className="mb-5 bg-background"
          onChange={(event) => setMemo(event.target.value)}
          placeholder="メモ（任意）"
          value={memo}
        />

        <div className="mb-5 border-t border-border pt-4">
          <button
            className="inline-flex items-center gap-1 text-xs font-bold tracking-widest text-muted-foreground"
            onClick={() => setShowJournal((value) => !value)}
            type="button"
          >
            仕訳プレビュー（自動生成）
            <ChevronDown
              className={cn("size-4 transition", showJournal && "rotate-180")}
            />
          </button>
          {showJournal ? (
            <div className="mt-3 space-y-2">
              {journal.map((line) => (
                <div
                  className="grid grid-cols-[2.5rem_1fr_auto] gap-3 text-sm"
                  key={`${line.side}-${line.account}`}
                >
                  <span className="text-xs text-muted-foreground">
                    {line.side}
                  </span>
                  <span>{line.account}</span>
                  <span className="font-mono">{yen(line.amount)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <Button
          className={cn(
            "h-12 w-full text-base font-bold tracking-widest",
            mode === "income"
              ? "bg-[var(--ledger-income)] hover:bg-[var(--ledger-income)]/90"
              : "bg-[var(--ledger-expense)] hover:bg-[var(--ledger-expense)]/90",
          )}
          disabled={!amountNumber || !entryDate || saving}
          onClick={handleSave}
          type="button"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          保存する
        </Button>
        {saved ? (
          <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[var(--ledger-income)]">
            <Check className="size-4" />
            保存した
          </div>
        ) : null}
      </Card>

      {recent.length > 0 ? (
        <section>
          <div className="mb-3 text-sm font-bold tracking-[0.2em] text-muted-foreground">
            最近の入力
          </div>
          <div className="space-y-2">
            {recent.map((item) => (
              <Card
                className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 border-border bg-card p-3"
                key={item.id}
              >
                <span className="font-mono text-sm text-muted-foreground">
                  {item.date.slice(5).replace("-", "/")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">
                    {item.label}
                  </span>
                  {[item.sub, item.memo].filter(Boolean).length > 0 ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {[item.sub, item.memo].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "font-mono text-sm font-bold",
                    item.mode === "income"
                      ? "text-[var(--ledger-income)]"
                      : "text-[var(--ledger-expense)]",
                  )}
                >
                  {item.mode === "income" ? "+" : "-"}
                  {yen(item.amount).slice(1)}
                </span>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
