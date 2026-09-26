import { prisma } from "@/lib/prisma";
import LocationsTable from "@/components/settings/LocationsTable";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const [locations, warehouses] = await Promise.all([
    prisma.location.findMany({
      orderBy: [{ warehouse: { name: "asc" } }, { name: "asc" }],
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
      <LocationsTable locations={locations} warehouses={warehouses} />
    </div>
  );
}
