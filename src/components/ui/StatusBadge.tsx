const STATUS_STYLES: Record<string, string> = {
  DRAFT:    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  READY:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  WAITING:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  DONE:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELED: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
