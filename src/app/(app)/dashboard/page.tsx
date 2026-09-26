import Link from "next/link";
import {
  MdInventory2,
  MdLocalShipping,
  MdMoveToInbox,
  MdSwapHoriz,
  MdWarningAmber,
} from "react-icons/md";
import {
  getDashboardData,
  type DashboardDocumentType,
  type DashboardStatus,
} from "@/lib/services/dashboard";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

export const dynamic = "force-dynamic";

const documentTypes = ["ALL", "RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"] as const;
const statuses = ["ALL", "DRAFT", "WAITING", "READY", "DONE", "CANCELED"] as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawDocumentType = firstParam(params.documentType);
  const rawStatus = firstParam(params.status);
  const filters = {
    documentType: documentTypes.includes(rawDocumentType as DashboardDocumentType)
      ? (rawDocumentType as DashboardDocumentType)
      : "ALL",
    status: statuses.includes(rawStatus as DashboardStatus)
      ? (rawStatus as DashboardStatus)
      : "ALL",
    warehouseId: firstParam(params.warehouseId),
    locationId: firstParam(params.locationId),
    categoryId: firstParam(params.categoryId),
  };
  const { kpis, summaries, options, charts } = await getDashboardData(filters);
  const kpiCards = [
    {
      label: "Total Products in Stock",
      value: kpis.totalProductsInStock,
      detail: "Products with positive on-hand quantity",
      icon: MdInventory2,
      color: "text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-900/30",
    },
    {
      label: "Low / Out of Stock",
      value: kpis.lowOrOutOfStockItems,
      detail: "At or below reorder level, or at zero",
      icon: MdWarningAmber,
      color: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30",
    },
    {
      label: "Pending Receipts",
      value: kpis.pendingReceipts,
      detail: "Draft or ready",
      icon: MdMoveToInbox,
      color: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30",
    },
    {
      label: "Pending Delivery Orders",
      value: kpis.pendingDeliveryOrders,
      detail: "Draft, waiting, or ready",
      icon: MdLocalShipping,
      color: "text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30",
    },
    {
      label: "Scheduled Internal Transfers",
      value: kpis.scheduledInternalTransfers,
      detail: "Future dated, open transfers",
      icon: MdSwapHoriz,
      color: "text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/30",
    },
  ];
  const summaryIcons = {
    RECEIPT: MdMoveToInbox,
    DELIVERY: MdLocalShipping,
    TRANSFER: MdSwapHoriz,
    ADJUSTMENT: MdInventory2,
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Operational overview</p>
      </div>

      <section aria-label="Inventory KPIs" className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-5">
        {kpiCards.map(({ label, value, detail, icon: Icon, color }) => (
          <article key={label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-md ${color}`}>
                <Icon size={19} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </article>
        ))}
      </section>

      <section className="space-y-4" aria-labelledby="operation-summary-heading">
        <div>
          <h2 id="operation-summary-heading" className="text-lg font-semibold text-foreground">
            Operations
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Counts reflect the selected filters</p>
        </div>

        <form method="get" className="flex flex-wrap items-end gap-3 border-y border-border py-4">
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Document type
            <select name="documentType" defaultValue={filters.documentType} className="min-w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
              <option value="ALL">All operations</option>
              <option value="RECEIPT">Receipts</option>
              <option value="DELIVERY">Delivery Orders</option>
              <option value="TRANSFER">Internal Transfers</option>
              <option value="ADJUSTMENT">Adjustments</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Status
            <select name="status" defaultValue={filters.status} className="min-w-36 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="WAITING">Waiting</option>
              <option value="READY">Ready</option>
              <option value="DONE">Done</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Warehouse
            <select name="warehouseId" defaultValue={filters.warehouseId} className="min-w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
              <option value="">All warehouses</option>
              {options.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Location
            <select name="locationId" defaultValue={filters.locationId} className="min-w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
              <option value="">All locations</option>
              {options.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.warehouse.shortCode}/{location.shortCode} · {location.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Product category
            <select name="categoryId" defaultValue={filters.categoryId} className="min-w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
              <option value="">All categories</option>
              {options.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Apply filters
          </button>
          <Link href="/dashboard" className="px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Clear
          </Link>
        </form>

        {summaries.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No operation types match these filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {summaries.map((summary) => {
              const Icon = summaryIcons[summary.type];
              return (
                <article key={summary.type} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-foreground">{summary.label}</h3>
                        <p className="text-xs text-muted-foreground">{summary.total} operations</p>
                      </div>
                    </div>
                    <Link href={summary.href} className="text-sm font-medium text-primary hover:underline">View</Link>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div><dt className="text-xs text-muted-foreground">Late</dt><dd className="mt-1 font-semibold tabular-nums text-red-600">{summary.late}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Upcoming</dt><dd className="mt-1 font-semibold tabular-nums text-sky-700">{summary.upcoming}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Waiting</dt><dd className="mt-1 font-semibold tabular-nums text-amber-700">{summary.waiting}</dd></div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>Draft {summary.draft}</span>
                    <span>Ready {summary.ready}</span>
                    <span>Done {summary.done}</span>
                    <span>Canceled {summary.canceled}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <DashboardCharts data={charts} kpis={kpis} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-foreground">Low-stock watchlist</h2>
            <p className="text-sm text-muted-foreground">Products at or below reorder threshold</p>
          </div>
          {charts.lowStockItems.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">No low-stock items in the selected scope.</p>
          ) : (
            <div className="space-y-3">
              {charts.lowStockItems.map((item) => (
                <div key={`${item.name}-${item.location}`} className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category ?? "Uncategorized"} · {item.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-700 dark:text-amber-300">{item.onHand}</p>
                    <p className="text-xs text-muted-foreground">Reorder {item.reorderLevel ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-foreground">Operational pulse</h2>
            <p className="text-sm text-muted-foreground">Selected scope snapshot</p>
          </div>
          <div className="space-y-4">
            <div className="rounded-md bg-muted/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending receipts</span>
                <span className="font-semibold text-foreground">{kpis.pendingReceipts}</span>
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending deliveries</span>
                <span className="font-semibold text-foreground">{kpis.pendingDeliveryOrders}</span>
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Scheduled transfers</span>
                <span className="font-semibold text-foreground">{kpis.scheduledInternalTransfers}</span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
