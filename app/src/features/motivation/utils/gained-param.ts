export function parseGained(
  value: string | undefined,
  monthRevenue: number,
): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const gained = Number.parseInt(value, 10);

  return gained > 0 && gained <= monthRevenue ? gained : undefined;
}
