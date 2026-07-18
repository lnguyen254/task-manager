import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Pulls a user-facing message out of a JSON error body proxied from the API. */
export function extractErrorMessage(data: unknown): string {
  if (data && typeof data === "object" && "message" in data) {
    const { message } = data as { message: unknown }
    if (Array.isArray(message)) return String(message[0])
    if (typeof message === "string") return message
  }
  return "Something went wrong. Please try again."
}
