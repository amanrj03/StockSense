import { prisma } from "@/lib/prisma";
import ProductsTable from "@/components/products/ProductsTable";
import { firstParam, pageWindow, parsePage } from "@/lib/list-query";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = firstParam(params.q).trim();
  const categoryId = firstParam(params.categoryId);
  const [total, categories] = await Promise.all([
    prisma.product.count({ where: { ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" as const } }, { sku: { contains: query, mode: "insensitive" as const } }] } : {}), ...(categoryId ? { categoryId } : {}) } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const pagination = pageWindow(parsePage(params.page), total);
  const products = await prisma.product.findMany({
    where: { ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" as const } }, { sku: { contains: query, mode: "insensitive" as const } }] } : {}), ...(categoryId ? { categoryId } : {}) },
    orderBy: { name: "asc" },
    skip: pagination.skip,
    take: pagination.take,
    include: { category: { select: { name: true } } },
  });
  /* Serialize Decimal to string for the client component. */
  const serialized = products.map((p) => ({
    id: p.id, name: p.name, sku: p.sku, categoryId: p.categoryId, category: p.category,
    unitOfMeasure: p.unitOfMeasure, perUnitCost: p.perUnitCost.toString(), reorderLevel: p.reorderLevel, reorderQty: p.reorderQty,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Product master — create and manage products, categories, and UoM.
        </p>
      </div>
      <ProductsTable products={serialized} categories={categories} query={query} categoryId={categoryId} page={pagination.currentPage} totalPages={pagination.totalPages} />
    </div>
  );
}
