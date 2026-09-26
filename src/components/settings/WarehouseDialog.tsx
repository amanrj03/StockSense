"use client";

import { useActionState, useEffect, useRef } from "react";
import { MdClose, MdSave } from "react-icons/md";
import { createWarehouseAction, updateWarehouseAction } from "@/lib/actions/warehouse";

interface Warehouse {
  id: string;
  name: string;
  shortCode: string;
  address: string | null;
}

interface Props {
  warehouse?: Warehouse;
  onClose: () => void;
}

type State = { error: string } | { success: string } | undefined;

export default function WarehouseDialog({ warehouse, onClose }: Props) {
  const action = warehouse ? updateWarehouseAction : createWarehouseAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, undefined);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    if (state && "success" in state) onClose();
  }, [state, onClose]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border border-border bg-card p-0 shadow-lg backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">
          {warehouse ? "Edit Warehouse" : "New Warehouse"}
        </h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <MdClose size={20} />
        </button>
      </div>

      <form action={formAction} className="space-y-4 px-5 py-5">
        {warehouse && <input type="hidden" name="id" value={warehouse.id} />}

        <div className="space-y-1">
          <label htmlFor="wh-name" className="block text-sm font-medium text-foreground">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            id="wh-name"
            name="name"
            required
            defaultValue={warehouse?.name}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none
              focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            disabled={pending}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="wh-code" className="block text-sm font-medium text-foreground">
            Short Code <span className="text-destructive">*</span>
          </label>
          <input
            id="wh-code"
            name="shortCode"
            required
            maxLength={10}
            defaultValue={warehouse?.shortCode}
            placeholder="e.g. WH, WH2"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase outline-none
              focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            disabled={pending}
            onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }}
          />
          <p className="text-xs text-muted-foreground">Uppercase letters, numbers, hyphens only.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="wh-address" className="block text-sm font-medium text-foreground">
            Address
          </label>
          <textarea
            id="wh-address"
            name="address"
            rows={2}
            defaultValue={warehouse?.address ?? ""}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none
              focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            disabled={pending}
          />
        </div>

        {state && "error" in state && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground
              hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium
              text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {pending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <MdSave size={16} />
            )}
            Save
          </button>
        </div>
      </form>
    </dialog>
  );
}
