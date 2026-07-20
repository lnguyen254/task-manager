import { ApiError, extractErrorMessage } from "@/lib/utils";
import type { Tag } from "@/lib/tasks";

export const tagKeys = {
  all: ["tags"] as const,
  lists: () => [...tagKeys.all, "list"] as const,
  list: () => [...tagKeys.lists()] as const,
};

export async function fetchTags(): Promise<Tag[]> {
  const response = await fetch("/api/tags");
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(response.status, extractErrorMessage(error));
  }
  return response.json();
}

export async function createTag(name: string): Promise<Tag> {
  const response = await fetch("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(response.status, extractErrorMessage(error));
  }
  return response.json();
}

export async function deleteTag(id: string): Promise<void> {
  const response = await fetch(`/api/tags/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(response.status, extractErrorMessage(error));
  }
}
