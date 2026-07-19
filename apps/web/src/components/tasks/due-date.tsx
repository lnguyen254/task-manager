import { useState } from "react";
import { Calendar } from "lucide-react";

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDueDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DueDate({ dueDate }: { dueDate: string | null }) {
  // Date.now() is impure and reading it directly in the render body
  // violates React's render-purity rules — a lazy useState initializer
  // runs exactly once (on mount) rather than on every render, which is
  // the sanctioned place for a one-time impure read.
  const [now] = useState(() => Date.now());

  if (!dueDate) return null;

  const date = new Date(dueDate);
  const isOverdue = date.getTime() < now;
  const isDueSoon = !isOverdue && date.getTime() - now <= DAY_MS;

  const colorClassName = isOverdue
    ? "text-red-600 dark:text-red-400"
    : isDueSoon
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${colorClassName}`}>
      <Calendar className="size-3.5" aria-hidden="true" />
      {formatDueDate(date)}
    </span>
  );
}
