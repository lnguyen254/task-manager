import type { TaskPriority } from "@/lib/tasks";

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; dotClassName: string }> = {
  LOW: { label: "Low priority", dotClassName: "bg-slate-400 dark:bg-slate-500" },
  MEDIUM: { label: "Medium priority", dotClassName: "bg-amber-500" },
  HIGH: { label: "High priority", dotClassName: "bg-red-500" },
};

export function PriorityIndicator({ priority }: { priority: TaskPriority }) {
  const { label, dotClassName } = PRIORITY_CONFIG[priority];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      title={label}
    >
      <span className={`size-2 shrink-0 rounded-full ${dotClassName}`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
