import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/ui/StatusBadge";
import { MdAdd, MdSearch, MdViewKanban, MdViewList } from "react-icons/md";
import Pagination from "@/components/ui/Pagination";
import { pageWindow, parsePage } from "@/lib/list-query";

export const dynamic = "force-dynamic";

const columns = ["DRAFT", "DONE"] as const;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AdjustmentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = firstParam(params.q).trim();
  const view = firstParam(params.view) === "kanban" ? "kanban" : "list";
  const page = parsePage(params.page);
  const where = query
    ? {
        OR: [
          { reference: { contains: query, mode: "insensitive" as const } },
          { product: { name: { contains: query, mode: "insensitive" as const } } },
          { product: { sku: { contains: query, mode: "insensitive" as const } } },
        ],
      }
    : undefined;
  const total = await prisma.stockAdjustment.count({ where });
  const pagination = pageWindow(page, total);
  const adjustments = await prisma.stockAdjustment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    ...(view === "list" ? { skip: pagination.skip, take: pagination.take } : {}),
    include: {
      product: { select: { name: true, sku: true, unitOfMeasure: true } },
      location: { include: { warehouse: { select: { shortCode: true } } } },
      responsible: { select: { loginId: true } },
    },
  });
  const viewHref = (nextView: "list" | "kanban") => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (pagination.currentPage > 1) search.set("page", String(pagination.currentPage));
    if (nextView !== "list") search.set("view", nextView);
    const suffix = search.toString();
    return `/operations/adjustments${suffix ? `?${suffix}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Stock Adjustments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Reconcile physical counts against recorded stock.</p>
        </div>
        <Link href="/operations/adjustments/new" className="inline-flex items-center justify-center gap-2 self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <MdAdd size={18} aria-hidden="true" /> NEW
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
        <form method="get" role="search" className="flex min-w-60 flex-1 items-center gap-2 sm:max-w-md">
          <MdSearch size={18} className="text-muted-foreground" aria-hidden="true" />
          <input type="search" name="q" defaultValue={query} placeholder="Search reference, product, or SKU" aria-label="Search adjustments" className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          {view === "kanban" && <input type="hidden" name="view" value="kanban" />}
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Search</button>
        </form>
        <div aria-label="View" className="inline-flex rounded-md border border-border p-1">
          <Link href={viewHref("list")} aria-label="List view" aria-current={view === "list" ? "page" : undefined} className={`rounded p-1.5 ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}><MdViewList size={20} aria-hidden="true" /></Link>
          <Link href={viewHref("kanban")} aria-label="Kanban view" aria-current={view === "kanban" ? "page" : undefined} className={`rounded p-1.5 ${view === "kanban" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}><MdViewKanban size={20} aria-hidden="true" /></Link>
        </div>
      </div>

      {adjustments.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-foreground">{query ? "No adjustments match your search" : "No Stock Adjustments yet"}</p>
          {!query && <p className="mt-1 text-xs text-muted-foreground">Create an adjustment after completing a physical count.</p>}
        </div>
      ) : view === "list" ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reference</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">System</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Physical</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Difference</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {adjustments.map((adjustment) => (
                <tr key={adjustment.id} className="bg-card hover:bg-muted/30">
                  <td className="px-4 py-3"><Link href={`/operations/adjustments/${adjustment.id}`} className="font-mono font-medium text-primary hover:underline">{adjustment.reference}</Link></td>
                  <td className="px-4 py-3"><span className="font-medium text-foreground">{adjustment.product.name}</span><span className="ml-2 font-mono text-xs text-muted-foreground">{adjustment.product.sku}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{adjustment.location.warehouse.shortCode}/{adjustment.location.shortCode}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{Number(adjustment.systemQuantity).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{Number(adjustment.physicalQuantity).toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${adjustment.difference.lessThan(0) ? "text-red-700" : adjustment.difference.greaterThan(0) ? "text-emerald-700" : "text-muted-foreground"}`}>{Number(adjustment.difference).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{adjustment.reason.toLowerCase()}</td>
                  <td className="px-4 py-3"><StatusBadge status={adjustment.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {columns.map((status) => {
            const columnAdjustments = adjustments.filter((adjustment) => adjustment.status === status);
            return (
              <section key={status} aria-label={`${status} adjustments`} className="w-72 shrink-0 rounded-md border border-border bg-muted/30 p-3">
                <div className="mb-3 flex items-center justify-between"><StatusBadge status={status} /><span className="text-xs tabular-nums text-muted-foreground">{columnAdjustments.length}</span></div>
                <div className="space-y-2">
                  {columnAdjustments.map((adjustment) => (
                    <Link key={adjustment.id} href={`/operations/adjustments/${adjustment.id}`} className="block rounded-md border border-border bg-card p-3 hover:border-primary/50">
                      <span className="font-mono text-xs font-semibold text-primary">{adjustment.reference}</span>
                      <span className="mt-1 block truncate text-sm font-medium text-foreground">{adjustment.product.name}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{adjustment.location.warehouse.shortCode}/{adjustment.location.shortCode}</span>
                      <span className={`mt-2 block text-sm font-semibold ${adjustment.difference.lessThan(0) ? "text-red-700" : "text-emerald-700"}`}>Difference {Number(adjustment.difference).toLocaleString()}</span>
                    </Link>
                  ))}
                  {columnAdjustments.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No adjustments</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {view === "list" && <Pagination pathname="/operations/adjustments" page={pagination.currentPage} totalPages={pagination.totalPages} params={{ q: query }} />}
    </div>
  );
}
