"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { MdAdd, MdDelete, MdSave } from "react-icons/md";
import { createInternalTransferAction } from "@/lib/actions/internal-transfer";

interface Warehouse { id: string; name: string; shortCode: string }
interface Location { id: string; name: string; shortCode: string; warehouseId: string }
interface Product { id: string; name: string; sku: string; unitOfMeasure: string }
interface Line { productId: string; quantity: string }
type State = { error: string } | { success: string } | undefined;

export default function NewInternalTransferForm({
  warehouses,
  locations,
  products,
  availability,
}: {
  warehouses: Warehouse[];
  locations: Location[];
  products: Product[];
  availability: Record<string, Record<string, number>>;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(createInternalTransferAction, undefined);
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: "" }]);

  function updateLine(index: number, field: keyof Line, value: string) {
    setLines((current) => current.map((line, lineIndex) =>
      lineIndex === index ? { ...line, [field]: value } : line
    ));
  }

  const sourceLocations = locations.filter((location) => location.warehouseId === sourceWarehouseId);
  const destinationLocations = locations.filter((location) => location.warehouseId === destinationWarehouseId);

  return (
    <form action={formAction} className="space-y-5">
      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Source</h2>
          <label className="grid gap-1 text-sm font-medium text-foreground">
            Warehouse
            <select value={sourceWarehouseId} onChange={(event) => { setSourceWarehouseId(event.target.value); setSourceLocationId(""); }} required className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal">
              <option value="">Select warehouse…</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.shortCode})</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-foreground">
            Location
            <select name="sourceLocationId" value={sourceLocationId} onChange={(event) => setSourceLocationId(event.target.value)} required className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal">
              <option value="">Select source location…</option>
              {sourceLocations.map((location) => <option key={location.id} value={location.id}>{location.name} ({location.shortCode})</option>)}
            </select>
          </label>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Destination</h2>
          <label className="grid gap-1 text-sm font-medium text-foreground">
            Warehouse
            <select value={destinationWarehouseId} onChange={(event) => setDestinationWarehouseId(event.target.value)} required className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal">
              <option value="">Select warehouse…</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.shortCode})</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-foreground">
            Location
            <select name="destinationLocationId" required className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal">
              <option value="">Select destination location…</option>
              {destinationLocations.map((location) => <option key={location.id} value={location.id}>{location.name} ({location.shortCode})</option>)}
            </select>
          </label>
        </div>
        <label className="grid gap-1 text-sm font-medium text-foreground md:col-span-2">
          Schedule Date
          <input name="scheduleDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm font-normal" />
        </label>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Products</h2>
          <button type="button" onClick={() => setLines((current) => [...current, { productId: "", quantity: "" }])} className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><MdAdd size={16} aria-hidden="true" /> Add Product</button>
        </div>
        <div className="divide-y divide-border">
          {lines.map((line, index) => {
            const product = products.find((item) => item.id === line.productId);
            const available = sourceLocationId && line.productId ? availability[sourceLocationId]?.[line.productId] ?? 0 : 0;
            const shortfall = Boolean(product && Number(line.quantity) > available);
            return (
              <div key={index} className={`grid gap-3 px-5 py-4 sm:grid-cols-[minmax(12rem,1fr)_8rem_8rem_auto] sm:items-start ${shortfall ? "bg-red-50/70 dark:bg-red-950/20" : ""}`}>
                <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                  Product
                  <select value={line.productId} onChange={(event) => updateLine(index, "productId", event.target.value)} required aria-label="Product" className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal text-foreground">
                    <option value="">Select product…</option>
                    {products.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}
                  </select>
                  {shortfall && <span role="alert" className="text-xs font-medium text-red-700 dark:text-red-300">Insufficient free stock at source.</span>}
                </label>
                <label className="grid gap-1 text-xs font-medium text-muted-foreground">Available<output className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-normal text-foreground">{product ? `${available} ${product.unitOfMeasure}` : "—"}</output></label>
                <label className="grid gap-1 text-xs font-medium text-muted-foreground">Quantity<input type="number" min="0.001" max="999999999.999" step="0.001" value={line.quantity} onChange={(event) => updateLine(index, "quantity", event.target.value)} required aria-label="Quantity" className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal text-foreground" /></label>
                <button type="button" onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} disabled={lines.length === 1} aria-label="Remove product line" className="mt-5 rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"><MdDelete size={17} aria-hidden="true" /></button>
              </div>
            );
          })}
        </div>
      </section>

      <input type="hidden" name="lines" value={JSON.stringify(lines.map((line) => ({ productId: line.productId, quantity: Number(line.quantity) })))} />
      {state && "error" in state && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {pending ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <MdSave size={16} aria-hidden="true" />} Save Draft
        </button>
        <Link href="/operations/internal-transfers" className="rounded-md border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancel</Link>
      </div>
    </form>
  );
}