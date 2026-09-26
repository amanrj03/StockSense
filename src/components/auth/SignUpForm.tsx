"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MdPersonAdd, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useState } from "react";
import AuthCard from "./AuthCard";
import { signUpAction } from "@/lib/actions/auth";

export default function SignUpForm() {
  const [state, action, pending] = useActionState<{ error: string } | undefined, FormData>(signUpAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <AuthCard title="Create your account" subtitle="Lemon Inventory Management">
      <form action={action} className="space-y-4">
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
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none
              placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20
              disabled:opacity-50"
            placeholder="6–12 characters"
            disabled={pending}
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email ID
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none
              placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20
              disabled:opacity-50"
            placeholder="you@example.com"
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
              autoComplete="new-password"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm outline-none
                placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20
                disabled:opacity-50"
              placeholder="Min 8 chars, upper, lower, special"
              disabled={pending}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Re-enter Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm outline-none
                placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20
                disabled:opacity-50"
              placeholder="Repeat your password"
              disabled={pending}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {state?.error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5
            text-sm font-semibold text-primary-foreground transition-colors
            hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <MdPersonAdd size={18} />
          )}
          {pending ? "Creating account…" : "SIGN UP"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
