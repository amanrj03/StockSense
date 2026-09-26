import { prisma } from "@/lib/prisma";
import NewReceiptForm from "@/components/receipts/NewReceiptForm";

export const dynamic = "force-dynamic";

export default async function NewReceiptPage() {
  const [locations, products] = await Promise.all([
    prisma.location.findMany({
      orderBy: { name: "asc" },
      include: { warehouse: { select: { name: true, shortCode: true } } },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unitOfMeasure: true },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">New Receipt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new incoming stock receipt.
        </p>
      </div>
      <NewReceiptForm locations={locations} products={products} />
    </div>
  );
}
