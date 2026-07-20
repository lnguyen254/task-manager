import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskFilterBar } from "@/components/tasks/task-filter-bar";
import { TaskList } from "@/components/tasks/task-list";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard - Task Manager",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">
          Welcome, {user.name}
        </h1>
        <CreateTaskDialog />
      </div>
      {/* TaskFilterBar and TaskList both read useSearchParams(), which
          requires a Suspense boundary in the App Router. */}
      <Suspense>
        <div className="mt-6">
          <TaskFilterBar />
        </div>
        <div className="mt-4">
          <TaskList />
        </div>
      </Suspense>
    </div>
  );
}
