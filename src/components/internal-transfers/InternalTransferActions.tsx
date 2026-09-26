"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MdCancel, MdCheckCircle, MdPlayArrow } from "react-icons/md";
import {
  cancelInternalTransferAction,
  markInternalTransferReadyAction,
  validateInternalTransferAction,
} from "@/lib/actions/internal-transfer";

interface Props {
  id: string;
  status: string;
}

type Action = (id: string) => Promise<{ error: string } | { success: string } | undefined>;

export default function InternalTransferActions({ id, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function run(action: Action) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await action(id);
        if (result && "error" in result) setError(result.error);
        else if (result && "success" in result) setMessage(result.success);
        router.refresh();
      } catch {
        setError("The transfer could not be updated. Reload and try again.");
      }
    });
  }

  if (status === "DONE" || status === "CANCELED") return null;

  return (
    <section aria-label="Internal Transfer workflow" className="space-y-3 border-t border-border pt-5">
      {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{message}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {status === "DRAFT" && (
          <button type="button" onClick={() => run(markInternalTransferReadyAction)} disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60">
            <MdPlayArrow size={18} aria-hidden="true" /> Mark Ready
          </button>
        )}
        {status === "READY" && (
          <button type="button" onClick={() => run(validateInternalTransferAction)} disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60">
            <MdCheckCircle size={17} aria-hidden="true" /> Validate Transfer
          </button>
        )}
        <button type="button" onClick={() => run(cancelInternalTransferAction)} disabled={pending} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-60">
          <MdCancel size={17} aria-hidden="true" /> Cancel
        </button>
      </div>
    </section>
  );
}