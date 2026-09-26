import { prisma } from "@/lib/prisma";

export interface InventoryNotification {
  id: string;
  category: "STOCK" | "WAITING" | "LATE";
  severity: "HIGH" | "MEDIUM";
  title: string;
  detail: string;
  href: string;
}

export async function getInventoryNotifications(): Promise<InventoryNotification[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [products, waitingOrders, lateReceipts, lateDeliveries, lateTransfers] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        reorderLevel: true,
        stockEntries: { select: { onHand: true } },
      },
    }),
    prisma.deliveryOrder.findMany({
      where: { status: "WAITING" },
      orderBy: { scheduleDate: "asc" },
      select: { id: true, reference: true, contact: true },
    }),
    prisma.receipt.findMany({
      where: { status: { in: ["DRAFT", "READY"] }, scheduleDate: { lt: today } },
      orderBy: { scheduleDate: "asc" },
      select: { id: true, reference: true, scheduleDate: true },
    }),
    prisma.deliveryOrder.findMany({
      where: { status: { in: ["DRAFT", "WAITING", "READY"] }, scheduleDate: { lt: today } },
      orderBy: { scheduleDate: "asc" },
      select: { id: true, reference: true, scheduleDate: true },
    }),
    prisma.internalTransfer.findMany({
      where: { status: { in: ["DRAFT", "READY"] }, scheduleDate: { lt: today } },
      orderBy: { scheduleDate: "asc" },
      select: { id: true, reference: true, scheduleDate: true },
    }),
  ]);

  const notifications: InventoryNotification[] = [];
  for (const product of products) {
    const onHand = product.stockEntries.reduce((total, entry) => total + Number(entry.onHand), 0);
    const isOut = onHand === 0;
    if (isOut || (product.reorderLevel !== null && onHand <= product.reorderLevel)) {
      notifications.push({
        id: `stock-${product.id}`,
        category: "STOCK",
        severity: isOut ? "HIGH" : "MEDIUM",
        title: isOut ? "Out of stock" : "Low stock",
        detail: `${product.name} (${product.sku}) · on hand ${onHand.toLocaleString()}`,
        href: "/stock",
      });
    }
  }

  for (const order of waitingOrders) {
    notifications.push({
      id: `waiting-${order.id}`,
      category: "WAITING",
      severity: "HIGH",
      title: `Waiting for stock · ${order.reference}`,
      detail: order.contact,
      href: `/operations/delivery-orders/${order.id}`,
    });
  }

  for (const receipt of lateReceipts) {
    notifications.push({
      id: `late-receipt-${receipt.id}`,
      category: "LATE",
      severity: "MEDIUM",
      title: `Late Receipt · ${receipt.reference}`,
      detail: `Scheduled ${receipt.scheduleDate.toLocaleDateString()}`,
      href: `/operations/receipts/${receipt.id}`,
    });
  }
  for (const order of lateDeliveries) {
    notifications.push({
      id: `late-delivery-${order.id}`,
      category: "LATE",
      severity: "MEDIUM",
      title: `Late Delivery Order · ${order.reference}`,
      detail: `Scheduled ${order.scheduleDate.toLocaleDateString()}`,
      href: `/operations/delivery-orders/${order.id}`,
    });
  }
  for (const transfer of lateTransfers) {
    notifications.push({
      id: `late-transfer-${transfer.id}`,
      category: "LATE",
      severity: "MEDIUM",
      title: `Late Internal Transfer · ${transfer.reference}`,
      detail: `Scheduled ${transfer.scheduleDate.toLocaleDateString()}`,
      href: `/operations/internal-transfers/${transfer.id}`,
    });
  }

  return notifications;
}