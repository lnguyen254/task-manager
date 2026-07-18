import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Stay on top of your tasks
      </h1>
      <p className="max-w-md text-muted-foreground">
        A simple, personal task manager to plan, tag, and track what matters.
      </p>
      <div className="flex gap-3">
        <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
          Get started
        </Link>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Log in
        </Link>
      </div>
    </section>
  );
}
