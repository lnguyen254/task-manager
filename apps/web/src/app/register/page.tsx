import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Sign up - Task Manager",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <RegisterForm />
    </div>
  );
}
