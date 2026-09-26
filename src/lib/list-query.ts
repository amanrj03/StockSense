export const DEFAULT_PAGE_SIZE = 25;

export function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parsePage(value: string | string[] | undefined): number {
  const page = Number.parseInt(firstParam(value), 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function pageWindow(page: number, total: number, pageSize = DEFAULT_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  return { currentPage, totalPages, skip: (currentPage - 1) * pageSize, take: pageSize };
}

export function queryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
  return search.toString();
}
