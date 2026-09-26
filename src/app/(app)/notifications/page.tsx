import Link from "next/link";
import { getInventoryNotifications } from "@/lib/services/notifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifications = await getInventoryNotifications();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Current inventory alerts and overdue operations</p>
      </div>

      {notifications.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No active alerts.
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Link href={notification.href} className="flex items-start gap-3 py-4 hover:bg-muted/30">
                <span aria-hidden="true" className={`mt-1 size-2 shrink-0 rounded-full ${notification.severity === "HIGH" ? "bg-red-600" : "bg-amber-500"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{notification.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{notification.detail}</span>
                </span>
                <span className="text-xs font-medium uppercase text-muted-foreground">{notification.category}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}