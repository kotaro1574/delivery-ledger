export function yen(value: number) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}
