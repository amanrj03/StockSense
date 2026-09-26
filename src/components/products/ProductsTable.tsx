"use client";

import { useState, useTransition } from "react";
import { MdEdit, MdDelete, MdAdd, MdInventory2, MdSearch } from "react-icons/md";
import { deleteProductAction } from "@/lib/actions/product";
import ProductDialog from "./ProductDialog";
import Pagination from "@/components/ui/Pagination";

interface Category { id: string; name: string }
interface Product {
  id: string; name: string; sku: string;
  categoryId: string | null;
  category: { name: string } | null;
  unitOfMeasure: string;
  perUnitCost: string;
  reorderLevel: number | null;
  reorderQty: number | null;
}

interface Props { products: Product[]; categories: Category[]; query: string; categoryId: string; page: number; totalPages: number }

export default function ProductsTable({ products, categories, query, categoryId, page, totalPages }: Props) {
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; product?: Product } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete product "${name}"?`)) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteProductAction(id);
      if (result && "error" in result) setDeleteError(result.error);
    });
  }

  return (
    <div>
      {deleteError && (
        <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{deleteError}</p>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <form method="get" className="flex flex-1 flex-wrap items-center gap-2 sm:max-w-2xl">
          <div className="flex min-w-52 flex-1 items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5">
            <MdSearch size={16} className="shrink-0 text-muted-foreground" />
            <input type="search" name="q" defaultValue={query} placeholder="Search by name or SKU…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" aria-label="Search products" />
          </div>
          <select name="categoryId" defaultValue={categoryId} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Filter</button>
        </form>
        <button
          onClick={() => setDialog({ mode: "create" })}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <MdAdd size={18} /> New Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <MdInventory2 size={40} className="text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">
            {query || categoryId ? "No products match these filters" : "No products yet"}
          </p>
          {!query && !categoryId && <p className="mt-1 text-xs text-muted-foreground">Create your first product to get started.</p>}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">UoM</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cost</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Reorder</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary">{p.sku}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.unitOfMeasure}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">₹ {Number(p.perUnitCost).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {p.reorderLevel != null ? `≤ ${p.reorderLevel}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setDialog({ mode: "edit", product: p })}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        aria-label={`Edit ${p.name}`}>
                        <MdEdit size={16} />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)} disabled={isPending}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                        aria-label={`Delete ${p.name}`}>
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog && (
        <ProductDialog
          product={dialog.mode === "edit" ? dialog.product : undefined}
          categories={categories}
          onClose={() => setDialog(null)}
        />
      )}
      <Pagination pathname="/products" page={page} totalPages={totalPages} params={{ q: query, categoryId }} />
    </div>
  );
}
