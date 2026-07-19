import { extractErrorMessage } from "@/lib/utils";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Tag {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export interface TaskListResponse {
  data: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type TaskSortBy = "createdAt" | "dueDate" | "priority" | "title";
export type SortOrder = "asc" | "desc";

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  tagId?: string;
  search?: string;
  sortBy?: TaskSortBy;
  sortOrder?: SortOrder;
}

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters: TaskFilters = {}) => [...taskKeys.lists(), filters] as const,
};

export async function fetchTasks(filters: TaskFilters = {}): Promise<TaskListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.tagId) params.set("tagId", filters.tagId);
  if (filters.search) params.set("search", filters.search);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  const queryString = params.toString();

  const response = await fetch(`/api/tasks${queryString ? `?${queryString}` : ""}`);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(extractErrorMessage(error));
  }
  return response.json();
}

export interface TaskInput {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  tagIds: string[];
}

export async function createTask(input: TaskInput): Promise<Task> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(extractErrorMessage(error));
  }
  return response.json();
}

export async function updateTask(id: string, input: TaskInput): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(extractErrorMessage(error));
  }
  return response.json();
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(extractErrorMessage(error));
  }
}
