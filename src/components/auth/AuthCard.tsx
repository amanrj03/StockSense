interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      {/* Brand */}
      <div className="mb-6 flex flex-col items-center gap-1 text-center">
        <span className="text-4xl leading-none">🍋</span>
        <h1 className="mt-2 text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
