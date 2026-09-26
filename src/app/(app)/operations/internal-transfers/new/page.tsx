import { prisma } from "@/lib/prisma";
import NewInternalTransferForm from "@/components/internal-transfers/NewInternalTransferForm";

export const dynamic = "force-dynamic";

export default async function NewInternalTransferPage() {
  const [warehouses, locations, products, stockRows] = await Promise.all([
    prisma.warehouse.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, shortCode: true } }),
    prisma.location.findMany({ orderBy: [{ warehouse: { name: "asc" } }, { name: "asc" }], select: { id: true, name: true, shortCode: true, warehouseId: true } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, sku: true, unitOfMeasure: true } }),
    prisma.stock.findMany({ select: { productId: true, locationId: true, onHand: true, reserved: true } }),
  ]);

  const availability: Record<string, Record<string, number>> = {};
  for (const stock of stockRows) {
    availability[stock.locationId] ??= {};
    availability[stock.locationId][stock.productId] = Number(stock.onHand.minus(stock.reserved));
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">New Internal Transfer</h1>
        <p className="mt-1 text-sm text-muted-foreground">Relocate stock between warehouse locations.</p>
      </div>
      {warehouses.length === 0 || locations.length < 2 || products.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          Add products and at least two locations before creating a transfer.
        </p>
      ) : (
        <NewInternalTransferForm warehouses={warehouses} locations={locations} products={products} availability={availability} />
      )}
    </div>
  );
}