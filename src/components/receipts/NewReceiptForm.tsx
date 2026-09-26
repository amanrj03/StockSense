"use client";

import { useActionState, useState } from "react";
import { MdAdd, MdDelete, MdSave } from "react-icons/md";
import { createReceiptAction } from "@/lib/actions/receipt";
import Link from "next/link";

interface Location {
  id: string;
  name: string;
  shortCode: string;
  warehouse: { name: string; shortCode: string };
}
interface Product {
  id: string;
  name: string;
  sku: string;
  unitOfMeasure: string;
}
interface Line { productId: string; quantity: string }

type State = { error: string } | { success: string } | undefined;

export default function NewReceiptForm({
  locations,
  products,
}: {
  locations: Location[];
  products: Product[];
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(createReceiptAction, undefined);
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: "" }]);

  function addLine() {
    setLines((prev) => [...prev, { productId: "", quantity: "" }]);
  }
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateLine(i: number, field: keyof Line, value: string) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }


  return (
    <form action={formAction} className="space-y-6">
      {/* Header fields */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="toLocationId" className="block text-sm font-medium text-foreground">
              Destination Location <span className="text-destructive">*</span>
            </label>
            <select id="toLocationId" name="toLocationId" required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              disabled={pending}>
              <option value="">Select location…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.warehouse.name} / {l.name} ({l.warehouse.shortCode}/{l.shortCode})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="contact" className="block text-sm font-medium text-foreground">
              Vendor / Contact <span className="text-destructive">*</span>
            </label>
            <input id="contact" name="contact" required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              placeholder="Vendor name"
              disabled={pending} />
          </div>

          <div className="space-y-1">
            <label htmlFor="scheduleDate" className="block text-sm font-medium text-foreground">
              Schedule Date <span className="text-destructive">*</span>
            </label>
            <input id="scheduleDate" name="scheduleDate" type="date" required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              disabled={pending} />
          </div>
        </div>
      </div>

      {/* Lines */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Products</h2>
          <button type="button" onClick={addLine}
            className="flex items-center gap-1 text-sm text-primary hover:underline">
            <MdAdd size={16} /> Add Product
          </button>
        </div>
        <div className="divide-y divide-border">
          {lines.map((line, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1">
                <select
                  value={line.productId}
                  onChange={(e) => updateLine(i, "productId", e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  aria-label="Product"
                >
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, "quantity", e.target.value)}
                  required
                  placeholder="Qty"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  aria-label="Quantity"
                />
              </div>
              <button
                type="button"
                onClick={() => removeLine(i)}
                disabled={lines.length === 1}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-30"
                aria-label="Remove line"
              >
                <MdDelete size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden lines field for server action */}
      <input
        type="hidden"
        name="lines"
        value={JSON.stringify(lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })))}
      />

      {state && "error" in state && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending}
          className="flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
          {pending
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            : <MdSave size={16} />}
          Save Draft
        </button>
        <Link href="/operations/receipts"
          className="rounded-md border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
          Cancel
        </Link>
      </div>
    </form>
  );
}
