import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(size = 21) {
  return crypto.randomUUID().replaceAll("-", "").slice(0, size);
}
