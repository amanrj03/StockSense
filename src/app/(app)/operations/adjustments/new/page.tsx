import { prisma } from "@/lib/prisma";
import NewStockAdjustmentForm from "@/components/adjustments/NewStockAdjustmentForm";

export const dynamic = "force-dynamic";

export default async function NewStockAdjustmentPage() {
  const [warehouses, locations, products, stockRows] = await Promise.all([
    prisma.warehouse.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, shortCode: true } }),
    prisma.location.findMany({ orderBy: [{ warehouse: { name: "asc" } }, { name: "asc" }], select: { id: true, name: true, shortCode: true, warehouseId: true } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, sku: true, unitOfMeasure: true } }),
    prisma.stock.findMany({ select: { productId: true, locationId: true, onHand: true, reserved: true } }),
  ]);

  const systemQuantities: Record<string, Record<string, number>> = {};
  for (const stock of stockRows) {
    systemQuantities[stock.locationId] ??= {};
    systemQuantities[stock.locationId][stock.productId] = Number(stock.onHand);
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">New Stock Adjustment</h1>
        <p className="mt-1 text-sm text-muted-foreground">Record a physical count against current stock.</p>
      </div>
      {warehouses.length === 0 || locations.length === 0 || products.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          Add a warehouse, location, and product before recording an adjustment.
        </p>
      ) : (
        <NewStockAdjustmentForm warehouses={warehouses} locations={locations} products={products} systemQuantities={systemQuantities} />
      )}
    </div>
  );
}