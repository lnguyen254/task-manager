import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors TaskRow's layout so loading doesn't cause a layout shift. */
export function TaskRowSkeleton() {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <Skeleton className="size-2 rounded-full" />
      <Skeleton className="h-4 min-w-0 flex-1" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </li>
  );
}
