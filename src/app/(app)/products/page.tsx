import { prisma } from "@/lib/prisma";
import ProductsTable from "@/components/products/ProductsTable";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { category: { select: { name: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  // Serialize Decimal to string for client component
  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    categoryId: p.categoryId,
    category: p.category,
    unitOfMeasure: p.unitOfMeasure,
    perUnitCost: p.perUnitCost.toString(),
    reorderLevel: p.reorderLevel,
    reorderQty: p.reorderQty,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Product master — create and manage products, categories, and UoM.
        </p>
      </div>
      <ProductsTable products={serialized} categories={categories} />
    </div>
  );
}
