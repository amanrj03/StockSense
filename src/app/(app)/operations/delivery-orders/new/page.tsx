import { prisma } from "@/lib/prisma";
import NewDeliveryOrderForm from "@/components/delivery-orders/NewDeliveryOrderForm";

export const dynamic = "force-dynamic";

export default async function NewDeliveryOrderPage() {
  const [locations, products, stockRows] = await Promise.all([
    prisma.location.findMany({
      orderBy: [{ warehouse: { name: "asc" } }, { name: "asc" }],
      include: { warehouse: { select: { name: true, shortCode: true } } },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unitOfMeasure: true },
    }),
    prisma.stock.findMany({
      select: { productId: true, locationId: true, onHand: true, reserved: true },
    }),
  ]);

  const availability: Record<string, Record<string, number>> = {};
  for (const stock of stockRows) {
    availability[stock.locationId] ??= {};
    availability[stock.locationId][stock.productId] = Number(stock.onHand.minus(stock.reserved));
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">New Delivery Order</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create an outgoing stock document.</p>
      </div>
      {locations.length === 0 || products.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          Add at least one warehouse location and product before creating a Delivery Order.
        </div>
      ) : (
        <NewDeliveryOrderForm locations={locations} products={products} availability={availability} />
      )}
    </div>
  );
}