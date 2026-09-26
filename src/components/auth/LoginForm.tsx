"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MdLogin, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useState } from "react";
import AuthCard from "./AuthCard";
import { signInAction } from "@/lib/actions/auth";

interface LoginFormProps {
  successMessage?: string;
}

export default function LoginForm({ successMessage }: LoginFormProps) {
  const [state, action, pending] = useActionState<{ error: string } | undefined, FormData>(signInAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  return (
    <AuthCard layout="split" title="Welcome back" subtitle="Sign in to your Lemon inventory workspace.">
      {successMessage && (
        <p role="status" className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200">
          {successMessage}
        </p>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        {/* Login ID */}
        <div className="space-y-1">
          <label htmlFor="loginId" className="block text-sm font-medium text-foreground">
            Login ID
          </label>
          <input
            id="loginId"
            name="loginId"
            type="text"
            autoComplete="username"
            required
            minLength={6}
            maxLength={12}
            className="h-12 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none transition
              placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15
              disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter your login ID"
            disabled={pending}
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="h-12 w-full rounded-lg border border-input bg-background px-4 pr-12 text-sm outline-none transition
                placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15
                disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter your password"
              disabled={pending}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {state?.error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        {/* Forgot password */}
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4
            text-sm font-semibold text-primary-foreground transition-colors
            hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <MdLogin size={18} />
          )}
          {pending ? "Signing in…" : "SIGN IN"}
        </button>

        {/* Sign up link */}
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            Create an account
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
