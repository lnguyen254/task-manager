"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/utils";

const loginSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }),
  password: z.string().min(1, { error: "Enter your password." }),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({
  sessionExpiredMessage,
}: {
  sessionExpiredMessage?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(
    sessionExpiredMessage ?? null,
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: standardSchemaResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setFormError(null);

    let response: Response;
    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    } catch {
      setFormError("Unable to reach the server. Please try again.");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setFormError(extractErrorMessage(data));
      return;
    }

    // Defensive: if a previous session's queries are still cached in this
    // tab (e.g. an expired session that was never explicitly logged out
    // of), don't let them leak into the newly-logged-in user's view.
    queryClient.clear();
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>
          Welcome back. Enter your details to continue.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={handleSubmit(onSubmit, () => setFormError(null))}
        noValidate
      >
        <CardContent className="flex flex-col gap-4">
          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
