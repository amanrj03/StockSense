import { prisma } from "@/lib/prisma";

export async function searchInventory(query: string) {
  const term = query.trim();
  if (!term) return null;
  const contains = { contains: term, mode: "insensitive" as const };

  const [products, receipts, deliveryOrders, transfers, adjustments, warehouses, locations] =
    await Promise.all([
      prisma.product.findMany({
        where: { OR: [{ name: contains }, { sku: contains }] },
        orderBy: { name: "asc" },
        select: { id: true, name: true, sku: true, unitOfMeasure: true },
      }),
      prisma.receipt.findMany({
        where: { OR: [{ reference: contains }, { contact: contains }] },
        orderBy: { createdAt: "desc" },
        select: { id: true, reference: true, contact: true, status: true },
      }),
      prisma.deliveryOrder.findMany({
        where: { OR: [{ reference: contains }, { contact: contains }] },
        orderBy: { createdAt: "desc" },
        select: { id: true, reference: true, contact: true, status: true },
      }),
      prisma.internalTransfer.findMany({
        where: { reference: contains },
        orderBy: { createdAt: "desc" },
        select: { id: true, reference: true, status: true },
      }),
      prisma.stockAdjustment.findMany({
        where: {
          OR: [
            { reference: contains },
            { product: { name: contains } },
            { product: { sku: contains } },
          ],
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reference: true,
          status: true,
          product: { select: { name: true, sku: true } },
        },
      }),
      prisma.warehouse.findMany({
        where: { OR: [{ name: contains }, { shortCode: contains }] },
        orderBy: { name: "asc" },
        select: { id: true, name: true, shortCode: true },
      }),
      prisma.location.findMany({
        where: {
          OR: [{ name: contains }, { shortCode: contains }, { warehouse: { shortCode: contains } }],
        },
        orderBy: { name: "asc" },
        include: { warehouse: { select: { name: true, shortCode: true } } },
      }),
    ]);

  return { products, receipts, deliveryOrders, transfers, adjustments, warehouses, locations };
}