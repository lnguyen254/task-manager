import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Task Manager
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
