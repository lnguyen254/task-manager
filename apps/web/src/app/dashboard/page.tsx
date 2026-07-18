import type { Metadata } from "next";
import { redirect } from "next/navigation";

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
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, {user.name}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Task management UI goes here.
      </p>
    </div>
  );
}
