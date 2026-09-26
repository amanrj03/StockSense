import { redirect } from "next/navigation";
import { MdEmail, MdInventory2, MdLock, MdPerson, MdSwapHoriz } from "react-icons/md";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      loginId: true,
      email: true,
      createdAt: true,
      _count: { select: { receipts: true, deliveryOrders: true, internalTransfers: true, adjustments: true } },
    },
  });
  if (!user) redirect("/login");

  const displayName = session.user?.name || user.loginId;
  const initials = displayName.slice(0, 2).toUpperCase();
  const activity = [
    { label: "Receipts created", value: user._count.receipts, icon: MdInventory2 },
    { label: "Delivery orders", value: user._count.deliveryOrders, icon: MdInventory2 },
    { label: "Internal transfers", value: user._count.internalTransfers, icon: MdSwapHoriz },
    { label: "Stock adjustments", value: user._count.adjustments, icon: MdInventory2 },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your Lemon account and warehouse activity.</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <article className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
              {initials}
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">{displayName}</p>
              <p className="mt-1 text-sm text-muted-foreground">Lemon inventory operator</p>
            </div>
          </div>

          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><MdPerson size={16} /> Login ID</dt>
              <dd className="mt-2 text-sm font-medium text-foreground">{user.loginId}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><MdEmail size={16} /> Email address</dt>
              <dd className="mt-2 break-all text-sm font-medium text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account created</dt>
              <dd className="mt-2 text-sm font-medium text-foreground">{user.createdAt.toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Access</dt>
              <dd className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">Active account</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-muted text-foreground"><MdLock size={20} /></span>
            <div>
              <h2 className="font-semibold text-foreground">Account security</h2>
              <p className="text-xs text-muted-foreground">Credential status</p>
            </div>
          </div>
          <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            Your account is protected by password authentication and an active session.
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Use Forgot Password on the sign-in page if you need to reset your credentials.</p>
        </article>
      </section>

      <section aria-labelledby="profile-activity-heading" className="rounded-lg border border-border bg-card p-6">
        <div className="mb-5">
          <h2 id="profile-activity-heading" className="text-lg font-semibold text-foreground">My activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">Operations created by this account.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {activity.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-md bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">{label}</span><Icon size={18} className="text-primary" /></div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
