"use client";

import { useActionState, useEffect, useRef } from "react";
import { MdClose, MdSave } from "react-icons/md";
import { createProductAction, updateProductAction } from "@/lib/actions/product";

const UOM_OPTIONS = ["pcs", "kg", "g", "ltr", "ml", "m", "cm", "box", "set", "pair"];

interface Category { id: string; name: string }
interface Product {
  id: string; name: string; sku: string;
  categoryId: string | null; unitOfMeasure: string;
  perUnitCost: string; reorderLevel: number | null; reorderQty: number | null;
}

type State = { error: string } | { success: string } | undefined;

interface Props {
  product?: Product;
  categories: Category[];
  onClose: () => void;
}

export default function ProductDialog({ product, categories, onClose }: Props) {
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, undefined);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => { dialogRef.current?.showModal(); }, []);
  useEffect(() => { if (state && "success" in state) onClose(); }, [state, onClose]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="product-dialog-title"
      className="fixed left-1/2 top-1/2 m-0 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-0 shadow-lg backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 id="product-dialog-title" className="text-base font-semibold text-foreground">
          {product ? "Edit Product" : "New Product"}
        </h2>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
          <MdClose size={20} />
        </button>
      </div>

      <form action={formAction} className="px-5 py-5 space-y-4">
        {product && <input type="hidden" name="id" value={product.id} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="p-name" className="block text-sm font-medium text-foreground">
              Name <span className="text-destructive">*</span>
            </label>
            <input id="p-name" name="name" required defaultValue={product?.name}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              disabled={pending} />
          </div>

          {/* SKU */}
          <div className="space-y-1">
            <label htmlFor="p-sku" className="block text-sm font-medium text-foreground">
              SKU / Code <span className="text-destructive">*</span>
            </label>
            <input id="p-sku" name="sku" required maxLength={50}
              defaultValue={product?.sku} placeholder="e.g. DESK-001"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              disabled={pending}
              onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }} />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label htmlFor="p-cat" className="block text-sm font-medium text-foreground">Category</label>
            <select id="p-cat" name="categoryId" defaultValue={product?.categoryId ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              disabled={pending}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Unit of Measure */}
          <div className="space-y-1">
            <label htmlFor="p-uom" className="block text-sm font-medium text-foreground">
              Unit of Measure <span className="text-destructive">*</span>
            </label>
            <select id="p-uom" name="unitOfMeasure" required defaultValue={product?.unitOfMeasure ?? "pcs"}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              disabled={pending}>
              {UOM_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Per Unit Cost */}
          <div className="space-y-1">
            <label htmlFor="p-cost" className="block text-sm font-medium text-foreground">Per Unit Cost</label>
            <input id="p-cost" name="perUnitCost" type="number" min="0" step="0.01"
              defaultValue={product?.perUnitCost ?? "0"}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              disabled={pending} />
          </div>

          {/* Reorder Level */}
          <div className="space-y-1">
            <label htmlFor="p-rl" className="block text-sm font-medium text-foreground">Reorder Level</label>
            <input id="p-rl" name="reorderLevel" type="number" min="0" step="1"
              defaultValue={product?.reorderLevel ?? ""}
              placeholder="Low-stock threshold"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              disabled={pending} />
          </div>

          {/* Reorder Qty */}
          <div className="space-y-1">
            <label htmlFor="p-rq" className="block text-sm font-medium text-foreground">Reorder Qty</label>
            <input id="p-rq" name="reorderQty" type="number" min="0" step="1"
              defaultValue={product?.reorderQty ?? ""}
              placeholder="Suggested order qty"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              disabled={pending} />
          </div>
        </div>

        {state && "error" in state && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={pending}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
            {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <MdSave size={16} />}
            Save
          </button>
        </div>
      </form>
    </dialog>
  );
}
