"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed to reach the server", error);
    }
    // Clear cookies is best-effort either way (see /api/auth/logout) — send
    // the user to /login regardless so they're not left on a stale page.
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? "Logging out..." : "Log out"}
    </Button>
  );
}
