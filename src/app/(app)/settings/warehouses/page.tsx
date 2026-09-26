import { prisma } from "@/lib/prisma";
import WarehousesTable from "@/components/settings/WarehousesTable";
import { firstParam, pageWindow, parsePage } from "@/lib/list-query";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function WarehousesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = firstParam(params.q).trim();
  const where = query ? { OR: [{ name: { contains: query, mode: "insensitive" as const } }, { shortCode: { contains: query, mode: "insensitive" as const } }] } : undefined;
  const total = await prisma.warehouse.count({ where });
  const pagination = pageWindow(parsePage(params.page), total);
  const warehouses = await prisma.warehouse.findMany({
    where,
    orderBy: { name: "asc" },
    skip: pagination.skip,
    take: pagination.take,
    include: { _count: { select: { locations: true } } },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Warehouses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage warehouse master records — name, short code, and address.
        </p>
      </div>
      <WarehousesTable warehouses={warehouses} query={query} page={pagination.currentPage} totalPages={pagination.totalPages} />
    </div>
  );
}
