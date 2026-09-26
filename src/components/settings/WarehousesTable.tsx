"use client";

import { useState, useTransition } from "react";
import { MdEdit, MdDelete, MdAdd, MdBusiness } from "react-icons/md";
import { deleteWarehouseAction } from "@/lib/actions/warehouse";
import WarehouseDialog from "./WarehouseDialog";

interface Warehouse {
  id: string;
  name: string;
  shortCode: string;
  address: string | null;
  _count: { locations: number };
}

export default function WarehousesTable({ warehouses }: { warehouses: Warehouse[] }) {
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; warehouse?: Warehouse } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm("Delete this warehouse?")) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteWarehouseAction(id);
      if (result && "error" in result) setDeleteError(result.error);
    });
  }

  return (
    <div>
      {deleteError && (
        <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {deleteError}
        </p>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{warehouses.length} warehouse{warehouses.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setDialog({ mode: "create" })}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium
            text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <MdAdd size={18} /> New Warehouse
        </button>
      </div>

      {warehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <MdBusiness size={40} className="text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">No warehouses yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create your first warehouse to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Short Code</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Address</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Locations</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {warehouses.map((wh) => (
                <tr key={wh.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{wh.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary">
                      {wh.shortCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{wh.address ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{wh._count.locations}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDialog({ mode: "edit", warehouse: wh })}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        aria-label={`Edit ${wh.name}`}
                      >
                        <MdEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(wh.id)}
                        disabled={isPending}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                        aria-label={`Delete ${wh.name}`}
                      >
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
        <WarehouseDialog
          warehouse={dialog.mode === "edit" ? dialog.warehouse : undefined}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
