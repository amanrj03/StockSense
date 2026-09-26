import { prisma } from "@/lib/prisma";
import LocationsTable from "@/components/settings/LocationsTable";
import { firstParam, pageWindow, parsePage } from "@/lib/list-query";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function LocationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = firstParam(params.q).trim();
  const warehouseId = firstParam(params.warehouseId);
  const where = { ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" as const } }, { shortCode: { contains: query, mode: "insensitive" as const } }] } : {}), ...(warehouseId ? { warehouseId } : {}) };
  const total = await prisma.location.count({ where });
  const pagination = pageWindow(parsePage(params.page), total);
  const [locations, warehouses] = await Promise.all([
    prisma.location.findMany({
      where,
      orderBy: [{ warehouse: { name: "asc" } }, { name: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
      include: { warehouse: { select: { name: true, shortCode: true } } },
    }),
    prisma.warehouse.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, shortCode: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Locations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage locations within warehouses — racks, rooms, and stock areas.
        </p>
      </div>
      <LocationsTable locations={locations} warehouses={warehouses} query={query} warehouseId={warehouseId} page={pagination.currentPage} totalPages={pagination.totalPages} />
    </div>
  );
}
