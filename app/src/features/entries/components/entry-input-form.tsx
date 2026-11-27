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
import { GameWindow } from "@/components/game/game-window";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
    throw new Error("レシートを アップロードできなかった…");
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
    throw new Error(result?.message ?? "レシートを よみとれなかった…");
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

      toast.success("レシートを よみとった！");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "レシートを よみとれなかった…",
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
        throw new Error("セーブできなかった…");
      }

      setRecent((items) => [
        {
          id: crypto.randomUUID(),
          mode,
          label: mode === "income" ? "うりあげ" : selectedCategory.name,
          amount: amountNumber,
          memo,
          sub:
            mode === "income"
              ? [
                  deliveryCount > 0 ? `${deliveryCount}件` : null,
                  totalOnlineMinutes > 0 ? `じきゅう${wage}` : null,
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
      toast.success("セーブした！");
      router.push(
        mode === "income"
          ? `/?month=${entryDate.slice(0, 7)}&gained=${amountNumber}`
          : "/",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "セーブできなかった…",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <GameWindow title="きろくする">
        <div className="mb-5 grid grid-cols-2 gap-2">
          <ModeButton
            active={mode === "income"}
            activeClassName="text-[var(--game-income)]"
            label="しゅうにゅう"
            onSelect={() => selectMode("income")}
          />
          <ModeButton
            active={mode === "expense"}
            activeClassName="text-[var(--game-expense)]"
            label="けいひ"
            onSelect={() => selectMode("expense")}
          />
        </div>

        <div className="mb-5">
          <label
            className="mb-2 block text-xs tracking-widest text-[var(--game-sub)]"
            htmlFor="entry-date"
          >
            はたらいた ひ
          </label>
          <Popover onOpenChange={setDateOpen} open={dateOpen}>
            <PopoverTrigger asChild>
              <Button
                className="w-full justify-start border-2 bg-transparent font-mono font-normal"
                id="entry-date"
                type="button"
                variant="outline"
              >
                <CalendarIcon className="size-4 text-[var(--game-sub)]" />
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
          className="mb-2 block text-xs tracking-widest text-[var(--game-sub)]"
          htmlFor="entry-amount"
        >
          {mode === "income" ? "この ひの うりあげ" : "きんがく"}
        </label>
        <div className="mb-5 flex items-baseline gap-2 border-b-2 border-[var(--game-line)] px-1 pb-3">
          <span className="font-mono text-2xl text-[var(--game-sub)]">¥</span>
          <input
            className="w-full bg-transparent font-mono text-4xl font-bold text-[var(--game-gold)] outline-none placeholder:text-[var(--game-sub)]/50"
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
            <div className="mb-2 text-xs tracking-widest text-[var(--game-sub)]">
              カテゴリ
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {expenseCategories.map((category) => (
                <button
                  className={cn(
                    "rounded-[4px] border-2 border-[var(--game-line)] px-3 py-2 text-sm transition hover:text-[var(--game-gold)]",
                    categoryCode === category.code &&
                      "border-[var(--game-gold)] text-[var(--game-gold)]",
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
              <div className="mb-5 font-mono text-xs text-[var(--game-sub)]">
                事業割合 {selectedCategory.ratio}% を じどうで
                てきよう（私用分は事業主貸へ）
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="mb-2 text-xs tracking-widest text-[var(--game-sub)]">
              はたらいた きろく（なくても OK）
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label
                  className="mb-1 block text-xs text-[var(--game-sub)]"
                  htmlFor="entry-deliveries"
                >
                  けんすう
                </label>
                <div className="flex h-12 items-center rounded-[4px] border-2 border-[var(--game-line)] bg-transparent px-3 py-2">
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
                    <span className="shrink-0 whitespace-nowrap text-xs text-[var(--game-sub)]">
                      時間
                    </span>
                  </label>
                  <label
                    className="flex h-12 items-center rounded-[4px] border-2 border-[var(--game-line)] bg-transparent px-3 py-2"
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
                    <span className="shrink-0 whitespace-nowrap text-xs text-[var(--game-sub)]">
                      分
                    </span>
                  </label>
                </div>
              </div>
            </div>
            {showStats ? (
              <div className="mb-5 grid grid-cols-2 gap-3 rounded-[4px] border-2 border-dashed border-[var(--game-line)]/40 p-3">
                <div>
                  <div className="mb-1 text-xs text-[var(--game-sub)]">
                    じきゅう
                  </div>
                  <div className="font-mono text-xl font-bold text-[var(--game-gold)]">
                    {wage}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-[var(--game-sub)]">
                    1けん あたり
                  </div>
                  <div className="font-mono text-xl font-bold text-[var(--game-gold)]">
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
              variant="game"
            >
              {analyzingReceipt ? (
                <Loader2 className="size-4 animate-spin" />
              ) : receipt ? (
                <Camera className="size-4" />
              ) : (
                <ScanText className="size-4" />
              )}
              {analyzingReceipt
                ? "よみとり中…"
                : receipt
                  ? receipt.name
                  : "レシートを よみとる"}
            </Button>
          </>
        ) : null}

        <Textarea
          className="mb-5"
          onChange={(event) => setMemo(event.target.value)}
          placeholder="メモ（なくても OK）"
          value={memo}
        />

        <div className="mb-5 border-t-2 border-dashed border-[var(--game-line)]/40 pt-4">
          <button
            className="inline-flex h-9 items-center gap-1 text-xs tracking-widest text-[var(--game-sub)] hover:text-[var(--game-gold)]"
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
                  <span className="text-xs text-[var(--game-sub)]">
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
          className="h-12 w-full text-base tracking-widest"
          disabled={!amountNumber || !entryDate || saving}
          onClick={handleSave}
          type="button"
          variant="gamePrimary"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          セーブする
        </Button>
        {saved ? (
          <div className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--game-income)]">
            <Check className="size-4" />
            セーブした！
          </div>
        ) : null}
      </GameWindow>

      {recent.length > 0 ? (
        <GameWindow className="px-0 pb-1" title="さいきんの きろく">
          <div>
            {recent.map((item) => (
              <div
                className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 border-b-2 border-dashed border-[var(--game-line)]/25 px-4 py-3 last:border-b-0"
                key={item.id}
              >
                <span className="font-mono text-sm text-[var(--game-sub)]">
                  {item.date.slice(5).replace("-", "/")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm">{item.label}</span>
                  {[item.sub, item.memo].filter(Boolean).length > 0 ? (
                    <span className="block truncate font-mono text-xs text-[var(--game-sub)]">
                      {[item.sub, item.memo].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "font-mono text-sm font-bold",
                    item.mode === "income"
                      ? "text-[var(--game-income)]"
                      : "text-[var(--game-expense)]",
                  )}
                >
                  {item.mode === "income" ? "+" : "-"}
                  {yen(item.amount).slice(1)}
                </span>
              </div>
            ))}
          </div>
        </GameWindow>
      ) : null}
    </div>
  );
}

function ModeButton({
  active,
  activeClassName,
  label,
  onSelect,
}: {
  active: boolean;
  activeClassName: string;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-1 rounded-[4px] border-2 text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-gold)]",
        active
          ? cn("border-[var(--game-line)]", activeClassName)
          : "border-[var(--game-line)]/30 text-[var(--game-sub)] hover:text-[var(--game-line)]",
      )}
      onClick={onSelect}
      type="button"
    >
      <span
        aria-hidden="true"
        className={cn("w-3 text-xs", !active && "invisible")}
      >
        ▶
      </span>
      {label}
    </button>
  );
}
