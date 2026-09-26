import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/ui/StatusBadge";
import { MdAdd } from "react-icons/md";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const receipts = await prisma.receipt.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      toLocation: {
        include: { warehouse: { select: { shortCode: true } } },
      },
      responsible: { select: { loginId: true } },
      _count: { select: { lines: true } },
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Receipts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Incoming stock — receive items from vendors into warehouse locations.
          </p>
        </div>
        <Link
          href="/operations/receipts/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <MdAdd size={18} /> NEW
        </Link>
      </div>

      {receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-foreground">No receipts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first receipt to start receiving stock.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reference</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">To Location</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Schedule Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lines</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {receipts.map((r) => {
                const schedDate = new Date(r.scheduleDate);
                schedDate.setHours(0, 0, 0, 0);
                const isLate =
                  r.status !== "DONE" &&
                  r.status !== "CANCELED" &&
                  schedDate < today;
                return (
                  <tr key={r.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/operations/receipts/${r.id}`}
                        className="font-mono text-sm font-medium text-primary hover:underline"
                      >
                        {r.reference}
                      </Link>
                      {isLate && (
                        <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          Late
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.toLocation.warehouse.shortCode}/{r.toLocation.shortCode}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.contact}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.scheduleDate.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r._count.lines}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
