"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MdEmail } from "react-icons/md";
import AuthCard from "./AuthCard";
import { forgotPasswordAction } from "@/lib/actions/auth";

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<{ error: string } | { success: string } | undefined, FormData>(forgotPasswordAction, undefined);

  if (state && 'success' in state) {
    return (
      <AuthCard title="Check your email">
        <p className="text-center text-sm text-muted-foreground">{state.success}</p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Enter the OTP sent to your email on the{" "}
          <Link href="/reset-password" className="font-medium text-primary hover:underline">
            reset password
          </Link>{" "}
          page.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot Password?"
      subtitle="Enter your email to receive a reset OTP"
    >
      <form action={action} className="space-y-4">
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

        {state && 'error' in state && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

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
            <MdEmail size={18} />
          )}
          {pending ? "Sending…" : "SEND OTP"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to Sign In
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
