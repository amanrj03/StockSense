import Link from "next/link";
import { notFound } from "next/navigation";
import { MdArrowBack } from "react-icons/md";
import StatusBadge from "@/components/ui/StatusBadge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InternalTransferDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const transfer = await prisma.internalTransfer.findUnique({
    where: { id },
    include: {
      sourceLocation: { include: { warehouse: { select: { name: true, shortCode: true } } } },
      destinationLocation: { include: { warehouse: { select: { name: true, shortCode: true } } } },
      responsible: { select: { loginId: true } },
      lines: {
        include: { product: { select: { name: true, sku: true, unitOfMeasure: true } } },
      },
    },
  });
  if (!transfer) notFound();

  const stocks = await prisma.stock.findMany({
    where: {
      locationId: transfer.sourceLocationId,
      productId: { in: transfer.lines.map((line) => line.productId) },
    },
    select: { productId: true, onHand: true, reserved: true },
  });
  const availability = new Map(
    stocks.map((stock) => [stock.productId, Number(stock.onHand.minus(stock.reserved))])
  );
  const lineStates = transfer.lines.map((line) => {
    const available = availability.get(line.productId) ?? 0;
    return { line, available, shortfall: Number(line.quantity) > available };
  });

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/operations/internal-transfers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <MdArrowBack size={16} aria-hidden="true" /> Internal Transfers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-semibold text-foreground">{transfer.reference}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Responsible: {transfer.responsible.loginId} · Created {transfer.createdAt.toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={transfer.status} />
      </div>

      {lineStates.some(({ shortfall }) => shortfall) && transfer.status !== "DONE" && (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          Free stock at the source is below the requested transfer quantity.
        </p>
      )}

      <section className="rounded-lg border border-border bg-card p-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Source Warehouse</dt>
            <dd className="mt-1 font-medium text-foreground">{transfer.sourceLocation.warehouse.name} ({transfer.sourceLocation.warehouse.shortCode})</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Destination Warehouse</dt>
            <dd className="mt-1 font-medium text-foreground">{transfer.destinationLocation.warehouse.name} ({transfer.destinationLocation.warehouse.shortCode})</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Source Location</dt>
            <dd className="mt-1 text-foreground">{transfer.sourceLocation.name} ({transfer.sourceLocation.shortCode})</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Destination Location</dt>
            <dd className="mt-1 text-foreground">{transfer.destinationLocation.name} ({transfer.destinationLocation.shortCode})</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-muted-foreground">Schedule Date</dt>
            <dd className="mt-1 text-foreground">{transfer.scheduleDate.toLocaleDateString()}</dd>
          </div>
        </dl>
      </section>

      <section className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Available</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Quantity</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">UoM</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {lineStates.map(({ line, available, shortfall }) => (
              <tr key={line.id} className={shortfall && transfer.status !== "DONE" ? "bg-red-50/70 dark:bg-red-950/20" : "bg-card"}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {line.product.name}
                  {shortfall && transfer.status !== "DONE" && <span className="ml-2 text-xs font-semibold text-red-700 dark:text-red-300">Insufficient stock</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{line.product.sku}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${shortfall && transfer.status !== "DONE" ? "font-semibold text-red-700 dark:text-red-300" : "text-muted-foreground"}`}>{available.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">{Number(line.quantity).toLocaleString()}</td>
                <td className="px-4 py-3 text-muted-foreground">{line.product.unitOfMeasure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}