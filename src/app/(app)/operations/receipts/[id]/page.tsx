import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/ui/StatusBadge";
import ReceiptActions from "@/components/receipts/ReceiptActions";
import { MdArrowBack } from "react-icons/md";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage(props: PageProps<"/operations/receipts/[id]">) {
  const { id } = await props.params;

  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: {
      toLocation: { include: { warehouse: { select: { name: true, shortCode: true } } } },
      responsible: { select: { loginId: true } },
      lines: {
        include: { product: { select: { name: true, sku: true, unitOfMeasure: true } } },
      },
    },
  });

  if (!receipt) notFound();

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <Link
        href="/operations/receipts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MdArrowBack size={16} /> Receipts
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-semibold text-foreground">{receipt.reference}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Received by {receipt.responsible.loginId} &middot; Created{" "}
            {receipt.createdAt.toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={receipt.status} />
      </div>

      {/* Details card */}
      <div className="mb-6 rounded-lg border border-border bg-card p-5">
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">To Location</dt>
            <dd className="mt-1 font-medium text-foreground">
              {receipt.toLocation.name}
              <span className="ml-1 text-xs text-muted-foreground">
                ({receipt.toLocation.warehouse.shortCode}/{receipt.toLocation.shortCode})
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact</dt>
            <dd className="mt-1 text-foreground">{receipt.contact}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Schedule Date</dt>
            <dd className="mt-1 text-foreground">{receipt.scheduleDate.toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>

      {/* Lines */}
      <div className="mb-6 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Quantity</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">UoM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {receipt.lines.map((line) => (
              <tr key={line.id} className="bg-card">
                <td className="px-4 py-3 font-medium text-foreground">{line.product.name}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary">
                    {line.product.sku}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-foreground">
                  {Number(line.quantity).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{line.product.unitOfMeasure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Workflow actions */}
      <ReceiptActions id={receipt.id} status={receipt.status} />
    </div>
  );
}
