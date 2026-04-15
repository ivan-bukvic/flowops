import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDisplayName(profile: { full_name?: string | null; email?: string | null } | null): string {
  return profile?.full_name || profile?.email || "Unknown User";
}

export function extractFileName(fileUrl: string): string {
  const last = fileUrl.split("/").pop() || fileUrl;
  const match = last.match(/^[0-9a-f-]{36}_(.+)$/i);
  return match ? match[1] : last;
}
