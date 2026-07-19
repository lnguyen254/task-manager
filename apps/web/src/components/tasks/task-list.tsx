"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { TaskRow } from "@/components/tasks/task-row";
import {
  fetchTasks,
  taskKeys,
  type TaskFilters,
  type TaskPriority,
  type TaskSortBy,
  type TaskStatus,
} from "@/lib/tasks";

function readFilters(searchParams: URLSearchParams): TaskFilters {
  return {
    status: (searchParams.get("status") as TaskStatus | null) ?? undefined,
    priority: (searchParams.get("priority") as TaskPriority | null) ?? undefined,
    tagId: searchParams.get("tagId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    sortBy: (searchParams.get("sortBy") as TaskSortBy | null) ?? undefined,
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc" | null) ?? undefined,
  };
}

export function TaskList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = readFilters(searchParams);

  const { data, isPending, isError, error } = useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => fetchTasks(filters),
  });

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading tasks…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Failed to load tasks."}
      </p>
    );
  }

  if (data.data.length === 0) {
    const hasActiveFilters = Object.values(filters).some(Boolean);

    if (hasActiveFilters) {
      return (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No tasks match your filters.
          </p>
          <Button variant="outline" size="sm" onClick={() => router.replace(pathname)}>
            Clear filters
          </Button>
        </div>
      );
    }

    return (
      <p className="text-sm text-muted-foreground">
        No tasks yet — create your first one.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {data.data.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </ul>
  );
}
