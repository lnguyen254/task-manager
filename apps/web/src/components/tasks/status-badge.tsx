import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/lib/tasks";

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  TODO: {
    label: "To do",
    className: "bg-muted text-muted-foreground",
  },
  IN_PROGRESS: {
    label: "In progress",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  DONE: {
    label: "Done",
    className: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`border-transparent ${className}`}>
      {status === "DONE" && <Check className="size-3" />}
      {label}
    </Badge>
  );
}
