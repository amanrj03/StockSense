import { prisma } from "@/lib/prisma";
import StockTable from "@/components/stock/StockTable";
import Pagination from "@/components/ui/Pagination";
import { firstParam, pageWindow, parsePage } from "@/lib/list-query";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function StockPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = firstParam(params.q).trim().toLowerCase();
  const stockStatus = ["ALL", "IN_STOCK", "LOW", "OUT"].includes(firstParam(params.stockStatus)) ? firstParam(params.stockStatus) : "ALL";
  // Fetch all products with their stock entries across all locations
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: {
      category: { select: { name: true } },
      stockEntries: {
        include: {
          location: {
            include: { warehouse: { select: { name: true, shortCode: true } } },
          },
        },
      },
    },
  });

  // Shape data for the client component
  const shaped = products.map((p) => {
    const entries = p.stockEntries.map((s) => {
      const onHand = Number(s.onHand);
      const reserved = Number(s.reserved);
      return {
        locationId: s.locationId,
        locationName: s.location.name,
        locationCode: s.location.shortCode,
        warehouseName: s.location.warehouse.name,
        warehouseCode: s.location.warehouse.shortCode,
        onHand,
        reserved,
        freeToUse: onHand - reserved,
      };
    });

    const totalOnHand = entries.reduce((sum, e) => sum + e.onHand, 0);
    const totalReserved = entries.reduce((sum, e) => sum + e.reserved, 0);

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      unitOfMeasure: p.unitOfMeasure,
      perUnitCost: Number(p.perUnitCost),
      category: p.category?.name ?? null,
      reorderLevel: p.reorderLevel,
      totalOnHand,
      totalReserved,
      totalFreeToUse: totalOnHand - totalReserved,
      entries,
    };
  });

  const lowStockCount = shaped.filter(
    (p) => p.reorderLevel != null && p.totalOnHand <= p.reorderLevel
  ).length;
  const filtered = shaped.filter((product) => {
    const matchesQuery = !query || product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query);
    const matchesStatus = stockStatus === "ALL" || (stockStatus === "OUT" && product.totalOnHand === 0) || (stockStatus === "LOW" && product.reorderLevel != null && product.totalOnHand <= product.reorderLevel) || (stockStatus === "IN_STOCK" && product.totalOnHand > 0);
    return matchesQuery && matchesStatus;
  });
  const pagination = pageWindow(parsePage(params.page), filtered.length);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Stock</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            On-hand and free-to-use quantities per product across all locations.
          </p>
        </div>
        {lowStockCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            ⚠ {lowStockCount} low stock item{lowStockCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <StockTable products={filtered.slice(pagination.skip, pagination.skip + pagination.take)} query={query} stockStatus={stockStatus} />
      <Pagination pathname="/stock" page={pagination.currentPage} totalPages={pagination.totalPages} params={{ q: query, stockStatus }} />
    </div>
  );
}
