"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MdCheckCircle } from "react-icons/md";
import { validateStockAdjustmentAction } from "@/lib/actions/stock-adjustment";

export default function StockAdjustmentActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (status !== "DRAFT") return null;

  function validate() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await validateStockAdjustmentAction(id);
        if (result && "error" in result) setError(result.error);
        else if (result && "success" in result) setMessage(result.success);
        router.refresh();
      } catch {
        setError("The adjustment could not be validated. Reload and try again.");
      }
    });
  }

  return (
    <section aria-label="Stock Adjustment workflow" className="space-y-3 border-t border-border pt-5">
      {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{message}</p>}
      <button type="button" onClick={validate} disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60">
        {pending ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <MdCheckCircle size={17} aria-hidden="true" />}
        Validate Adjustment
      </button>
    </section>
  );
}