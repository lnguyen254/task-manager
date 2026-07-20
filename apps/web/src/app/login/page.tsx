import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in - Task Manager",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionExpired?: string }>;
}) {
  const { sessionExpired } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <LoginForm
        sessionExpiredMessage={
          sessionExpired ? "Your session has expired. Please log in again." : undefined
        }
      />
    </div>
  );
}
