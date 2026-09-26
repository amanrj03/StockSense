"use client";

import { useState, useTransition } from "react";
import { MdEdit, MdDelete, MdAdd, MdLocationOn } from "react-icons/md";
import { deleteLocationAction } from "@/lib/actions/location";
import LocationDialog from "./LocationDialog";

interface Warehouse { id: string; name: string; shortCode: string }
interface Location {
  id: string;
  name: string;
  shortCode: string;
  warehouseId: string;
  warehouse: { name: string; shortCode: string };
}

interface Props {
  locations: Location[];
  warehouses: Warehouse[];
}

export default function LocationsTable({ locations, warehouses }: Props) {
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; location?: Location } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm("Delete this location?")) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteLocationAction(id);
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
        <p className="text-sm text-muted-foreground">{locations.length} location{locations.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setDialog({ mode: "create" })}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium
            text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <MdAdd size={18} /> New Location
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <MdLocationOn size={40} className="text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">No locations yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Add locations to your warehouses.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Short Code</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Warehouse</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {locations.map((loc) => (
                <tr key={loc.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{loc.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary">
                      {loc.shortCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {loc.warehouse.name}
                    <span className="ml-1 text-xs text-muted-foreground/60">({loc.warehouse.shortCode})</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDialog({ mode: "edit", location: loc })}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        aria-label={`Edit ${loc.name}`}
                      >
                        <MdEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id)}
                        disabled={isPending}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                        aria-label={`Delete ${loc.name}`}
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
        <LocationDialog
          location={dialog.mode === "edit" ? dialog.location : undefined}
          warehouses={warehouses}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
