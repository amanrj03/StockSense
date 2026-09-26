import Link from "next/link";
import { notFound } from "next/navigation";
import { MdArrowBack } from "react-icons/md";
import StockAdjustmentActions from "@/components/adjustments/StockAdjustmentActions";
import StatusBadge from "@/components/ui/StatusBadge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StockAdjustmentDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id },
    include: {
      product: { select: { name: true, sku: true, unitOfMeasure: true } },
      location: { include: { warehouse: { select: { name: true, shortCode: true } } } },
      responsible: { select: { loginId: true } },
    },
  });
  if (!adjustment) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/operations/adjustments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <MdArrowBack size={16} aria-hidden="true" /> Stock Adjustments
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-semibold text-foreground">{adjustment.reference}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Responsible: {adjustment.responsible.loginId} · Created {adjustment.createdAt.toLocaleDateString()}</p>
        </div>
        <StatusBadge status={adjustment.status} />
      </div>
      <section className="rounded-lg border border-border bg-card p-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-xs font-medium uppercase text-muted-foreground">Product</dt><dd className="mt-1 font-medium text-foreground">{adjustment.product.name} <span className="font-mono text-xs text-muted-foreground">({adjustment.product.sku})</span></dd></div>
          <div><dt className="text-xs font-medium uppercase text-muted-foreground">Warehouse</dt><dd className="mt-1 text-foreground">{adjustment.location.warehouse.name} ({adjustment.location.warehouse.shortCode})</dd></div>
          <div><dt className="text-xs font-medium uppercase text-muted-foreground">Location</dt><dd className="mt-1 text-foreground">{adjustment.location.name} ({adjustment.location.shortCode})</dd></div>
          <div><dt className="text-xs font-medium uppercase text-muted-foreground">Reason</dt><dd className="mt-1 text-foreground">{adjustment.reason.toLowerCase()}{adjustment.reasonNote ? ` — ${adjustment.reasonNote}` : ""}</dd></div>
        </dl>
      </section>
      <section className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">System Quantity</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Physical Quantity</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Difference</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">UoM</th>
          </tr></thead>
          <tbody><tr className="bg-card">
            <td className="px-4 py-3 font-medium text-foreground">{adjustment.product.name}</td>
            <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{Number(adjustment.systemQuantity).toLocaleString()}</td>
            <td className="px-4 py-3 text-right tabular-nums text-foreground">{Number(adjustment.physicalQuantity).toLocaleString()}</td>
            <td className={`px-4 py-3 text-right font-semibold tabular-nums ${adjustment.difference.lessThan(0) ? "text-red-700" : adjustment.difference.greaterThan(0) ? "text-emerald-700" : "text-muted-foreground"}`}>{Number(adjustment.difference).toLocaleString()}</td>
            <td className="px-4 py-3 text-muted-foreground">{adjustment.product.unitOfMeasure}</td>
          </tr></tbody>
        </table>
      </section>
      <StockAdjustmentActions id={adjustment.id} status={adjustment.status} />
    </div>
  );
}