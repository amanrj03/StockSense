"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardCharts as DashboardChartData, DashboardKpis } from "@/lib/services/dashboard";

type Props = {
  data: DashboardChartData;
  kpis: DashboardKpis;
};

const pieColors = ["#34d399", "#f59e0b", "#a78bfa", "#38bdf8"];

export default function DashboardCharts({ data, kpis }: Props) {
  return (
    <>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Stock by category</h2>
            <span className="text-xs text-muted-foreground">On hand</span>
          </div>
          <div className="h-64 w-full">
            {data.stockByCategory.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No stock data for this view.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stockByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#38bdf8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Movement trend</h2>
            <span className="text-xs text-muted-foreground">7-day flow</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.movementTrend}>
                <defs>
                  <linearGradient id="movementIncoming" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="movementOutgoing" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="incoming" stroke="#34d399" fill="url(#movementIncoming)" strokeWidth={2} />
                <Area type="monotone" dataKey="outgoing" stroke="#f59e0b" fill="url(#movementOutgoing)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Operation mix</h2>
            <span className="text-xs text-muted-foreground">Operation counts</span>
          </div>
          <div className="h-64 w-full">
            {data.operationMix.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No operations in this filter.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.operationMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={4}>
                    {data.operationMix.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={entry.fill ?? pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-foreground">Low-stock watchlist</h2>
            <p className="text-sm text-muted-foreground">Products at or below reorder threshold</p>
          </div>
          {data.lowStockItems.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">No low-stock items in the selected scope.</p>
          ) : (
            <div className="space-y-3">
              {data.lowStockItems.map((item) => (
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
    </>
  );
}
