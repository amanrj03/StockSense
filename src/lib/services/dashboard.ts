import { prisma } from "@/lib/prisma";

export interface DashboardKpis {
  totalProductsInStock: number;
  lowOrOutOfStockItems: number;
  pendingReceipts: number;
  pendingDeliveryOrders: number;
  scheduledInternalTransfers: number;
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [products, pendingReceipts, pendingDeliveryOrders, scheduledInternalTransfers] =
    await Promise.all([
      prisma.product.findMany({
        select: {
          reorderLevel: true,
          stockEntries: { select: { onHand: true } },
        },
      }),
      prisma.receipt.count({
        where: { status: { in: ["DRAFT", "READY"] } },
      }),
      prisma.deliveryOrder.count({
        where: { status: { in: ["DRAFT", "WAITING", "READY"] } },
      }),
      prisma.internalTransfer.count({
        where: {
          status: { in: ["DRAFT", "READY"] },
          scheduleDate: { gte: today },
        },
      }),
    ]);

  const quantities = products.map((product) => ({
    reorderLevel: product.reorderLevel,
    onHand: product.stockEntries.reduce((total, entry) => total + Number(entry.onHand), 0),
  }));

  return {
    totalProductsInStock: quantities.filter(({ onHand }) => onHand > 0).length,
    lowOrOutOfStockItems: quantities.filter(
      ({ onHand, reorderLevel }) =>
        onHand === 0 || (reorderLevel !== null && onHand <= reorderLevel)
    ).length,
    pendingReceipts,
    pendingDeliveryOrders,
    scheduledInternalTransfers,
  };
}