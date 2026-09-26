"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { MdSave } from "react-icons/md";
import { createStockAdjustmentAction } from "@/lib/actions/stock-adjustment";

interface Warehouse { id: string; name: string; shortCode: string }
interface Location { id: string; name: string; shortCode: string; warehouseId: string }
interface Product { id: string; name: string; sku: string; unitOfMeasure: string }
type State = { error: string } | { success: string } | undefined;

export default function NewStockAdjustmentForm({
  warehouses,
  locations,
  products,
  systemQuantities,
}: {
  warehouses: Warehouse[];
  locations: Location[];
  products: Product[];
  systemQuantities: Record<string, Record<string, number>>;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(createStockAdjustmentAction, undefined);
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [productId, setProductId] = useState("");
  const [physicalQuantity, setPhysicalQuantity] = useState("");
  const [reason, setReason] = useState("");

  const filteredLocations = locations.filter((location) => location.warehouseId === warehouseId);
  const product = products.find((item) => item.id === productId);
  const systemQuantity = locationId && productId
    ? systemQuantities[locationId]?.[productId] ?? 0
    : null;
  const difference = physicalQuantity !== "" && systemQuantity !== null
    ? Number(physicalQuantity) - systemQuantity
    : null;

  return (
    <form action={formAction} className="space-y-5">
      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-foreground">
          Warehouse
          <select value={warehouseId} onChange={(event) => { setWarehouseId(event.target.value); setLocationId(""); }} required className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal">
            <option value="">Select warehouse…</option>
            {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.shortCode})</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          Location
          <select name="locationId" value={locationId} onChange={(event) => setLocationId(event.target.value)} required className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal">
            <option value="">Select location…</option>
            {filteredLocations.map((location) => <option key={location.id} value={location.id}>{location.name} ({location.shortCode})</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground sm:col-span-2">
          Product
          <select name="productId" value={productId} onChange={(event) => setProductId(event.target.value)} required className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal">
            <option value="">Select product…</option>
            {products.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}
          </select>
        </label>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-3">
        <div className="grid gap-1 text-sm font-medium text-foreground">
          System Quantity
          <output className="rounded-md border border-border bg-muted/40 px-3 py-2 tabular-nums">
            {systemQuantity === null ? "Select product and location" : `${systemQuantity} ${product?.unitOfMeasure ?? ""}`}
          </output>
        </div>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          Physical Quantity
          <input name="physicalQuantity" type="number" min="0" max="999999999.999" step="0.001" required value={physicalQuantity} onChange={(event) => setPhysicalQuantity(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal" />
        </label>
        <div className="grid gap-1 text-sm font-medium text-foreground">
          Difference
          <output className={`rounded-md border border-border bg-muted/40 px-3 py-2 tabular-nums ${difference !== null && difference < 0 ? "text-red-700" : difference !== null && difference > 0 ? "text-emerald-700" : "text-foreground"}`}>
            {difference === null ? "—" : `${difference > 0 ? "+" : ""}${difference} ${product?.unitOfMeasure ?? ""}`}
          </output>
        </div>
        <label className="grid gap-1 text-sm font-medium text-foreground sm:col-span-1">
          Reason
          <select name="reason" value={reason} onChange={(event) => setReason(event.target.value)} required className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal">
            <option value="">Select reason…</option>
            <option value="DAMAGED">Damaged</option>
            <option value="LOST">Lost</option>
            <option value="MISCOUNT">Miscount</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        {reason === "OTHER" && (
          <label className="grid gap-1 text-sm font-medium text-foreground sm:col-span-2">
            Reason Note
            <input name="reasonNote" maxLength={500} className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal" />
          </label>
        )}
      </section>

      {state && "error" in state && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {pending ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <MdSave size={16} aria-hidden="true" />} Save Draft
        </button>
        <Link href="/operations/adjustments" className="rounded-md border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancel</Link>
      </div>
    </form>
  );
}