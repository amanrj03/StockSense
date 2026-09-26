import { MdArrowDownward, MdArrowUpward, MdSearch, MdViewKanban, MdViewList } from "react-icons/md";
import StatusBadge from "@/components/ui/StatusBadge";
import { getMoveHistory } from "@/lib/services/move-history";
import Link from "next/link";

export const dynamic = "force-dynamic";

const columns = ["DRAFT", "WAITING", "READY", "DONE", "CANCELED"] as const;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function MoveHistoryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = firstParam(params.q).trim();
  const view = firstParam(params.view) === "kanban" ? "kanban" : "list";
  const rows = await getMoveHistory(query);
  const viewHref = (nextView: "list" | "kanban") => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (nextView !== "list") search.set("view", nextView);
    const suffix = search.toString();
    return `/move-history${suffix ? `?${suffix}` : ""}`;
  };
  const directionIcon = (direction: "IN" | "OUT") => direction === "IN" ? MdArrowDownward : MdArrowUpward;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Move History</h1>
        <p className="mt-1 text-sm text-muted-foreground">Read-only stock movement ledger</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
        <form method="get" role="search" className="flex min-w-60 flex-1 items-center gap-2 sm:max-w-md">
          <MdSearch size={18} className="text-muted-foreground" aria-hidden="true" />
          <input type="search" name="q" defaultValue={query} placeholder="Search reference or contact" aria-label="Search move history by reference or contact" className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          {view === "kanban" && <input type="hidden" name="view" value="kanban" />}
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Search</button>
        </form>
        <div aria-label="View" className="inline-flex rounded-md border border-border p-1">
          <Link href={viewHref("list")} aria-label="List view" aria-current={view === "list" ? "page" : undefined} className={`rounded p-1.5 ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}><MdViewList size={20} aria-hidden="true" /></Link>
          <Link href={viewHref("kanban")} aria-label="Kanban view" aria-current={view === "kanban" ? "page" : undefined} className={`rounded p-1.5 ${view === "kanban" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}><MdViewKanban size={20} aria-hidden="true" /></Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-foreground">{query ? "No movements match your search" : "No stock movements yet"}</p>
          {!query && <p className="mt-1 text-xs text-muted-foreground">Validated stock operations appear here.</p>}
        </div>
      ) : view === "list" ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reference</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">From</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">To</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Quantity</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const Icon = directionIcon(row.direction);
                return (
                  <tr key={row.id} className="bg-card hover:bg-muted/30">
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold ${row.direction === "IN" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}><Icon size={15} aria-hidden="true" />{row.reference}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{row.date.toLocaleDateString()}</td>
                    <td className="px-4 py-3"><span className="font-medium text-foreground">{row.product}</span><span className="ml-2 font-mono text-xs text-muted-foreground">{row.sku}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{row.contact}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.from}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.to}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${row.direction === "IN" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{row.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {columns.map((status) => {
            const columnRows = rows.filter((row) => row.status === status);
            return (
              <section key={status} aria-label={`${status} movements`} className="w-72 shrink-0 rounded-md border border-border bg-muted/30 p-3">
                <div className="mb-3 flex items-center justify-between"><StatusBadge status={status} /><span className="text-xs tabular-nums text-muted-foreground">{columnRows.length}</span></div>
                <div className="space-y-2">
                  {columnRows.map((row) => {
                    const Icon = directionIcon(row.direction);
                    return (
                      <article key={row.id} className="rounded-md border border-border bg-card p-3">
                        <span className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${row.direction === "IN" ? "text-emerald-700" : "text-red-700"}`}><Icon size={14} aria-hidden="true" />{row.reference}</span>
                        <span className="mt-1 block truncate text-sm font-medium text-foreground">{row.product} ({row.sku})</span>
                        <span className="mt-2 block text-xs text-muted-foreground">{row.from} → {row.to}</span>
                        <span className={`mt-1 block text-sm font-semibold ${row.direction === "IN" ? "text-emerald-700" : "text-red-700"}`}>{row.quantity.toLocaleString()} · {row.date.toLocaleDateString()}</span>
                      </article>
                    );
                  })}
                  {columnRows.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No movements</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
