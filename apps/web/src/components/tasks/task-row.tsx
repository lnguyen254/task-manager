"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { DueDate } from "@/components/tasks/due-date";
import { PriorityIndicator } from "@/components/tasks/priority-indicator";
import { StatusBadge } from "@/components/tasks/status-badge";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/tasks";

export function TaskRow({ task }: { task: Task }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <li className="group flex flex-col gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
      <div className="flex min-w-0 items-center gap-2">
        <PriorityIndicator priority={task.priority} />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium",
            task.status === "DONE" && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </span>
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {task.tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-muted-foreground">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <DueDate dueDate={task.dueDate} />
        <StatusBadge status={task.status} />
      </div>

      {/* Hover-reveal only makes sense with a pointer — always visible on
          touch (below `sm`), since there's no hover state to reveal it. */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:focus-within:opacity-100 sm:group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit "${task.title}"`}
          onClick={() => setEditOpen(true)}
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Delete "${task.title}"`}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 />
        </Button>
      </div>

      <TaskFormDialog open={editOpen} onOpenChange={setEditOpen} task={task} />
      <DeleteTaskDialog open={deleteOpen} onOpenChange={setDeleteOpen} task={task} />
    </li>
  );
}
