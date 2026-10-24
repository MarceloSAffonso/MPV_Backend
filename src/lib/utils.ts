import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const sanitizeEmail = (value: string) => value.toLowerCase().replace(/[^a-z0-9._%+@-]/g, "").slice(0, 254);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
