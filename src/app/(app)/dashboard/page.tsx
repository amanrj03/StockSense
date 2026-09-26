import {
  MdInventory2,
  MdLocalShipping,
  MdMoveToInbox,
  MdSwapHoriz,
  MdWarningAmber,
} from "react-icons/md";
import { getDashboardKpis } from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const kpis = await getDashboardKpis();
  const cards = [
    {
      label: "Total Products in Stock",
      value: kpis.totalProductsInStock,
      detail: "Products with available on-hand quantity",
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
      detail: "Due today or later",
      icon: MdSwapHoriz,
      color: "text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Operational overview</p>
      </div>

      <section aria-label="Inventory KPIs" className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-5">
        {cards.map(({ label, value, detail, icon: Icon, color }) => (
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
    </div>
  );
}
