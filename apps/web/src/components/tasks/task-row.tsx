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
    <li className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <PriorityIndicator priority={task.priority} />

      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-medium",
          task.status === "DONE" && "text-muted-foreground line-through",
        )}
      >
        {task.title}
      </span>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {task.tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-muted-foreground">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <DueDate dueDate={task.dueDate} />

      <StatusBadge status={task.status} />

      <div className="flex items-center gap-1 opacity-0 focus-within:opacity-100 group-hover:opacity-100">
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
