"use client";

import { useTransition } from "react";
import { MdCheckCircle, MdPlayArrow, MdCancel, MdPrint } from "react-icons/md";
import {
  markReceiptReadyAction,
  validateReceiptAction,
  cancelReceiptAction,
} from "@/lib/actions/receipt";
import { useState } from "react";

interface Props {
  id: string;
  status: string;
}

export default function ReceiptActions({ id, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(action: (id: string) => Promise<{ error: string } | { success: string } | undefined>) {
    setError(null);
    startTransition(async () => {
      const result = await action(id);
      if (result && "error" in result) setError(result.error);
    });
  }

  const printButton = (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
    >
      <MdPrint size={18} aria-hidden="true" />
      Print
    </button>
  );

  if (status === "DONE" || status === "CANCELED") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {printButton}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {error && (
        <p role="alert" className="w-full rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {printButton}

      {status === "DRAFT" && (
        <button
          onClick={() => handle(markReceiptReadyAction)}
          disabled={isPending}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          <MdPlayArrow size={18} />
          {isPending ? "Processing…" : "TO DO"}
        </button>
      )}

      {status === "READY" && (
        <button
          onClick={() => handle(validateReceiptAction)}
          disabled={isPending}
          className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          <MdCheckCircle size={18} />
          {isPending ? "Validating…" : "Validate"}
        </button>
      )}

      {(status === "DRAFT" || status === "READY") && (
        <button
          onClick={() => handle(cancelReceiptAction)}
          disabled={isPending}
          className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-60"
        >
          <MdCancel size={18} />
          Cancel
        </button>
      )}
    </div>
  );
}
