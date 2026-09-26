"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MdCancel, MdCheckCircle, MdInventory2, MdLocalShipping, MdPlayArrow } from "react-icons/md";
import {
  cancelDeliveryOrderAction,
  markDeliveryOrderPackedAction,
  markDeliveryOrderPickedAction,
  prepareDeliveryOrderAction,
  validateDeliveryOrderAction,
} from "@/lib/actions/delivery-order";

interface Props {
  id: string;
  status: string;
  pickedAt: Date | null;
  packedAt: Date | null;
}

type Action = (id: string) => Promise<{ error: string } | { success: string } | undefined>;

export default function DeliveryOrderActions({ id, status, pickedAt, packedAt }: Props) {
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
        setError("The Delivery Order could not be updated. Reload and try again.");
      }
    });
  }

  if (status === "DONE" || status === "CANCELED") return null;

  return (
    <section aria-label="Delivery Order workflow" className="space-y-3 border-t border-border pt-5">
      {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{message}</p>}

      <div className="flex flex-wrap items-center gap-3">
        {(status === "DRAFT" || status === "WAITING") && (
          <button type="button" onClick={() => run(prepareDeliveryOrderAction)} disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60">
            {pending ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <MdPlayArrow size={18} aria-hidden="true" />}
            {status === "WAITING" ? "Recheck Availability" : "Check Availability"}
          </button>
        )}
        {status === "READY" && !pickedAt && (
          <button type="button" onClick={() => run(markDeliveryOrderPickedAction)} disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60">
            <MdInventory2 size={17} aria-hidden="true" /> Mark Picked
          </button>
        )}
        {status === "READY" && pickedAt && !packedAt && (
          <button type="button" onClick={() => run(markDeliveryOrderPackedAction)} disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60">
            <MdInventory2 size={17} aria-hidden="true" /> Mark Packed
          </button>
        )}
        {status === "READY" && pickedAt && packedAt && (
          <button type="button" onClick={() => run(validateDeliveryOrderAction)} disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60">
            <MdCheckCircle size={17} aria-hidden="true" /> Validate Delivery
          </button>
        )}
        <button type="button" onClick={() => run(cancelDeliveryOrderAction)} disabled={pending} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-60">
          <MdCancel size={17} aria-hidden="true" /> Cancel
        </button>
        {status === "READY" && pickedAt && packedAt && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MdLocalShipping size={15} aria-hidden="true" /> Ready to dispatch</span>}
      </div>
    </section>
  );
}