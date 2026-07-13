export function formatDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayString() {
  return formatDateString(new Date());
}

export function parseDateString(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateLabel(value: string) {
  const label = value.replaceAll("-", "/");
  return value === todayString() ? `${label}（今日）` : label;
}
