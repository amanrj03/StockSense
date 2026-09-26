"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MdSearch,
  MdExpandMore,
  MdExpandLess,
  MdWarningAmber,
} from "react-icons/md";

interface StockEntry {
  locationId: string;
  locationName: string;
  locationCode: string;
  warehouseName: string;
  warehouseCode: string;
  onHand: number;
  reserved: number;
  freeToUse: number;
}

interface ProductStock {
  id: string;
  name: string;
  sku: string;
  unitOfMeasure: string;
  category: string | null;
  reorderLevel: number | null;
  totalOnHand: number;
  totalReserved: number;
  totalFreeToUse: number;
  entries: StockEntry[];
}

export default function StockTable({ products }: { products: ProductStock[] }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function isLowStock(p: ProductStock) {
    return p.reorderLevel != null && p.totalOnHand <= p.reorderLevel;
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 max-w-xs">
        <MdSearch size={16} className="shrink-0 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Search stock"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            {search ? "No products match your search" : "No stock records yet"}
          </p>
          {!search && (
            <p className="mt-1 text-xs text-muted-foreground">
              Stock is created automatically when a Receipt is validated.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-8" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">UoM</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">On Hand</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Reserved</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Free to Use</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const low = isLowStock(p);
                const open = expanded.has(p.id);
                return (
                  <>
                    {/* Product summary row */}
                    <tr
                      key={p.id}
                      className={`bg-card transition-colors hover:bg-muted/30 ${low ? "bg-red-50/40 dark:bg-red-900/10" : ""}`}
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.entries.length > 0 && (
                          <button type="button" onClick={() => toggleExpand(p.id)} aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} ${p.name} location stock`} className="rounded p-1 hover:bg-muted hover:text-foreground">
                            {open ? <MdExpandLess size={16} aria-hidden="true" /> : <MdExpandMore size={16} aria-hidden="true" />}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{p.name}</span>
                        {low && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <MdWarningAmber size={12} /> Low stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary">{p.sku}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.unitOfMeasure}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{p.totalOnHand.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400">
                        {p.totalReserved > 0 ? p.totalReserved.toLocaleString() : "—"}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${low ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>
                        {p.totalFreeToUse.toLocaleString()}
                      </td>
                    </tr>

                    {/* Location breakdown rows */}
                    {open && p.entries.map((e) => (
                      <tr key={e.locationId} className="bg-muted/20">
                        <td className="px-4 py-2" />
                        <td className="px-4 py-2 pl-8 text-xs text-muted-foreground" colSpan={3}>
                          <span className="font-medium text-foreground">{e.locationName}</span>
                          <span className="ml-1 text-muted-foreground/60">
                            ({e.warehouseCode}/{e.locationCode})
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{/* uom */}</td>
                        <td className="px-4 py-2 text-right text-xs text-foreground">{e.onHand.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-xs text-orange-600 dark:text-orange-400">
                          {e.reserved > 0 ? e.reserved.toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-2 text-right text-xs font-medium text-green-700 dark:text-green-400">
                          {e.freeToUse.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Stock is read-only. To correct quantities, use{" "}
        <Link href="/operations/adjustments" className="text-primary hover:underline">
          Stock Adjustments
        </Link>.
      </p>
    </div>
  );
}
