"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@/lib/api/queries";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    try {
      await login.mutateAsync(data);
      router.push("/library");
      router.refresh();
    } catch {
      // error displayed via login.error
    }
  }

  return (
    <AuthCard title="Sign in to Bookworm">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
        aria-label="Sign in form"
      >
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-required="true"
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-sm text-error-text">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-required="true"
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p id="password-error" role="alert" className="text-sm text-error-text">
              {errors.password.message}
            </p>
          )}
        </div>

        {login.error && (
          <p
            role="alert"
            className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error-text"
          >
            {login.error.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || login.isPending}
        >
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-secondary">
        No account?{" "}
        <Link
          href="/register"
          className="text-primary hover:underline font-medium"
        >
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}
