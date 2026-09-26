import Image from "next/image";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  layout?: "card" | "split";
}

export default function AuthCard({ title, subtitle, children, layout = "card" }: AuthCardProps) {
  const brand = (
    <div className="mb-8 flex flex-col items-center gap-2 text-center">
      <Image
        src="/lemon_logo.png"
        alt="Lemon"
        width={64}
        height={64}
        className="h-16 w-16 object-contain"
        priority
        unoptimized
      />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Lemon</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );

  if (layout === "split") {
    return (
      <main className="grid min-h-screen bg-background lg:grid-cols-2">
        <section className="relative hidden min-h-[360px] overflow-hidden bg-[#18231d] lg:block" aria-label="Lemon warehouse operations">
          <Image
            src="/login.png"
            alt="Warehouse aisles with organized inventory storage"
            fill
            priority
            unoptimized
            className="object-cover object-center"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,24,18,0.08),rgba(14,24,18,0.78))]" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-white sm:p-12 xl:p-16">
            <div className="mb-6 h-1 w-12 rounded-full bg-(--color-lemon)" />
            <p className="max-w-md text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Inventory, simplified.
            </p>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/75 sm:text-base">
              Keep stock, warehouse operations, and every movement in one clear view.
            </p>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-md">
            {brand}
            {children}
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        {brand}
        {children}
      </div>
    </div>
  );
}
