import { prisma } from "@/lib/prisma";
import WarehousesTable from "@/components/settings/WarehousesTable";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  const warehouses = await prisma.warehouse.findMany({
    orderBy: { name: "asc" },
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
      <WarehousesTable warehouses={warehouses} />
    </div>
  );
}
