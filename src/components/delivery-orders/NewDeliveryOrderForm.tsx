"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { MdAdd, MdDelete, MdSave } from "react-icons/md";
import { createDeliveryOrderAction } from "@/lib/actions/delivery-order";

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

interface Line {
  productId: string;
  quantity: string;
}

type State = { error: string } | { success: string } | undefined;

export default function NewDeliveryOrderForm({
  locations,
  products,
  availability,
}: {
  locations: Location[];
  products: Product[];
  availability: Record<string, Record<string, number>>;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(createDeliveryOrderAction, undefined);
  const [locationId, setLocationId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: "" }]);

  function updateLine(index: number, field: keyof Line, value: string) {
    setLines((current) => current.map((line, lineIndex) =>
      lineIndex === index ? { ...line, [field]: value } : line
    ));
  }

  return (
    <form action={formAction} className="space-y-5">
      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-foreground">
          Source Location <span className="text-destructive">*</span>
          <select
            name="fromLocationId"
            required
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            disabled={pending}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal"
          >
            <option value="">Select location…</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.warehouse.name} / {location.name} ({location.warehouse.shortCode}/{location.shortCode})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          Customer / Contact <span className="text-destructive">*</span>
          <input name="contact" required maxLength={200} disabled={pending} className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          Delivery Address
          <input name="deliveryAddress" maxLength={500} disabled={pending} className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          Schedule Date <span className="text-destructive">*</span>
          <input name="scheduleDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} disabled={pending} className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          Operation Type
          <select name="operationType" defaultValue="" disabled={pending} className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal">
            <option value="">Select type…</option>
            <option value="STANDARD_SHIPMENT">Standard shipment</option>
            <option value="RETURN">Return</option>
          </select>
        </label>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Products</h2>
          <button type="button" onClick={() => setLines((current) => [...current, { productId: "", quantity: "" }])} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <MdAdd size={16} aria-hidden="true" /> Add Product
          </button>
        </div>
        <div className="divide-y divide-border">
          {lines.map((line, index) => {
            const product = products.find((item) => item.id === line.productId);
            const available = locationId && line.productId
              ? availability[locationId]?.[line.productId] ?? 0
              : 0;
            const shortfall = Boolean(product && Number(line.quantity) > available);

            return (
              <div key={index} className={`grid gap-3 px-5 py-4 sm:grid-cols-[minmax(12rem,1fr)_8rem_8rem_auto] sm:items-start ${shortfall ? "bg-red-50/70 dark:bg-red-950/20" : ""}`}>
                <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                  Product
                  <select value={line.productId} onChange={(event) => updateLine(index, "productId", event.target.value)} required disabled={pending} aria-label="Product" className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal text-foreground">
                    <option value="">Select product…</option>
                    {products.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}
                  </select>
                  {shortfall && <span role="alert" className="text-xs font-medium text-red-700 dark:text-red-300">Insufficient available stock for this quantity.</span>}
                </label>
                <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                  Available
                  <output className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-normal text-foreground">{product ? `${available} ${product.unitOfMeasure}` : "—"}</output>
                </label>
                <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                  Quantity
                  <input type="number" min="0.001" max="999999999.999" step="0.001" value={line.quantity} onChange={(event) => updateLine(index, "quantity", event.target.value)} required disabled={pending} aria-label="Quantity" className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal text-foreground" />
                </label>
                <button type="button" onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} disabled={pending || lines.length === 1} aria-label="Remove product line" className="mt-5 rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30">
                  <MdDelete size={17} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <input type="hidden" name="lines" value={JSON.stringify(lines.map((line) => ({ productId: line.productId, quantity: Number(line.quantity) })))} />
      {state && "error" in state && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {pending ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <MdSave size={16} aria-hidden="true" />}
          Save Draft
        </button>
        <Link href="/operations/delivery-orders" className="rounded-md border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancel</Link>
      </div>
    </form>
  );
}