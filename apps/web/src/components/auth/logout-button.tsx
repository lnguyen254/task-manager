"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed to reach the server", error);
    }
    // The QueryClient is a browser-lived singleton that survives
    // client-side navigation (see lib/query-client.ts) — without this, the
    // next user to log in in this tab would see the previous user's cached
    // tasks/tags until a full page reload.
    queryClient.clear();
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
