"use client";

import Link from "next/link";

export default function AuthenticatedError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section role="alert" className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">This page could not be loaded</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your data was not changed. Retry the request or return to the Dashboard.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Try again
        </button>
        <Link href="/dashboard" className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
          Dashboard
        </Link>
      </div>
    </section>
  );
}