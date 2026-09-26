import Link from "next/link";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { queryString } from "@/lib/list-query";

interface Props {
  pathname: string;
  page: number;
  totalPages: number;
  params?: Record<string, string | undefined>;
}

export default function Pagination({ pathname, page, totalPages, params = {} }: Props) {
  if (totalPages <= 1) return null;
  const href = (nextPage: number) => {
    const search = queryString({ ...params, page: String(nextPage) });
    return `${pathname}?${search}`;
  };
  return (
    <nav className="mt-4 flex items-center justify-between gap-3 text-sm" aria-label="Pagination">
      <span className="text-muted-foreground">Page {page} of {totalPages}</span>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={href(page - 1)} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 font-medium hover:bg-muted">
            <MdChevronLeft size={18} aria-hidden="true" /> Previous
          </Link>
        ) : <span className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-muted-foreground/50"><MdChevronLeft size={18} aria-hidden="true" /> Previous</span>}
        {page < totalPages ? (
          <Link href={href(page + 1)} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 font-medium hover:bg-muted">
            Next <MdChevronRight size={18} aria-hidden="true" />
          </Link>
        ) : <span className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-muted-foreground/50">Next <MdChevronRight size={18} aria-hidden="true" /></span>}
      </div>
    </nav>
  );
}
