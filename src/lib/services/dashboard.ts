import { prisma } from "@/lib/prisma";
import type {
  AdjustmentStatus,
  DeliveryOrderStatus,
  ReceiptStatus,
  TransferStatus,
} from "@/generated/prisma/enums";

const RECEIPT_STATUSES: readonly ReceiptStatus[] = ["DRAFT", "READY", "DONE", "CANCELED"];
const DELIVERY_STATUSES: readonly DeliveryOrderStatus[] = [
  "DRAFT",
  "WAITING",
  "READY",
  "DONE",
  "CANCELED",
];
const TRANSFER_STATUSES: readonly TransferStatus[] = ["DRAFT", "READY", "DONE", "CANCELED"];
const ADJUSTMENT_STATUSES: readonly AdjustmentStatus[] = ["DRAFT", "DONE"];

export type DashboardDocumentType = "ALL" | "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";
export type DashboardStatus =
  | "ALL"
  | "DRAFT"
  | "WAITING"
  | "READY"
  | "DONE"
  | "CANCELED";

export interface DashboardFilters {
  documentType: DashboardDocumentType;
  status: DashboardStatus;
  warehouseId: string;
  locationId: string;
  categoryId: string;
}

export interface DashboardKpis {
  totalProductsInStock: number;
  lowOrOutOfStockItems: number;
  pendingReceipts: number;
  pendingDeliveryOrders: number;
  scheduledInternalTransfers: number;
}

export interface DashboardOperationSummary {
  type: Exclude<DashboardDocumentType, "ALL">;
  label: string;
  href: string;
  total: number;
  pending: number;
  late: number;
  upcoming: number;
  waiting: number;
  draft: number;
  ready: number;
  done: number;
  canceled: number;
}

export interface DashboardChartPoint {
  date: string;
  incoming: number;
  outgoing: number;
  net: number;
}

export interface DashboardChartSerie {
  name: string;
  value: number;
  fill?: string;
}

export interface DashboardLowStockItem {
  name: string;
  category: string | null;
  onHand: number;
  reorderLevel: number | null;
  location: string;
}

export interface DashboardCharts {
  stockByCategory: DashboardChartSerie[];
  movementTrend: DashboardChartPoint[];
  operationMix: DashboardChartSerie[];
  lowStockItems: DashboardLowStockItem[];
}

function resolveStatus<T extends string>(
  requested: DashboardStatus,
  supported: readonly T[]
): T | null | undefined {
  if (requested === "ALL") return undefined;
  return supported.includes(requested as T) ? (requested as T) : null;
}

function summarizeOperations(
  records: { status: string; scheduleDate: Date | null }[],
  today: Date
) {
  const pendingRecords = records.filter(
    ({ status }) => status !== "DONE" && status !== "CANCELED"
  );

  return {
    total: records.length,
    pending: pendingRecords.length,
    late: pendingRecords.filter(({ scheduleDate }) => scheduleDate !== null && scheduleDate < today)
      .length,
    upcoming: pendingRecords.filter(
      ({ scheduleDate }) => scheduleDate !== null && scheduleDate > today
    ).length,
    waiting: records.filter(({ status }) => status === "WAITING").length,
    draft: records.filter(({ status }) => status === "DRAFT").length,
    ready: records.filter(({ status }) => status === "READY").length,
    done: records.filter(({ status }) => status === "DONE").length,
    canceled: records.filter(({ status }) => status === "CANCELED").length,
  };
}

export async function getDashboardData(filters: DashboardFilters): Promise<{
  kpis: DashboardKpis;
  summaries: DashboardOperationSummary[];
  options: {
    warehouses: { id: string; name: string; shortCode: string }[];
    locations: { id: string; name: string; shortCode: string; warehouse: { shortCode: string } }[];
    categories: { id: string; name: string }[];
  };
  charts: DashboardCharts;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const locationScope = {
    ...(filters.locationId ? { id: filters.locationId } : {}),
    ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
  };
  const hasLocationScope = Boolean(filters.locationId || filters.warehouseId);
  const receiptStatus = resolveStatus(filters.status, RECEIPT_STATUSES);
  const deliveryStatus = resolveStatus(filters.status, DELIVERY_STATUSES);
  const transferStatus = resolveStatus(filters.status, TRANSFER_STATUSES);
  const adjustmentStatus = resolveStatus(filters.status, ADJUSTMENT_STATUSES);
  const selected = (type: Exclude<DashboardDocumentType, "ALL">) =>
    filters.documentType === "ALL" || filters.documentType === type;

  const [products, receiptRows, deliveryRows, transferRows, adjustmentRows, warehouses, locations, categories] =
    await Promise.all([
      prisma.product.findMany({
        where: filters.categoryId ? { categoryId: filters.categoryId } : undefined,
        select: {
          id: true,
          name: true,
          category: { select: { name: true } },
          reorderLevel: true,
          stockEntries: {
            where: {
              ...(filters.locationId ? { locationId: filters.locationId } : {}),
              ...(filters.warehouseId ? { location: { warehouseId: filters.warehouseId } } : {}),
            },
            select: { onHand: true, location: { select: { name: true } } },
          },
        },
      }),
      !selected("RECEIPT") || receiptStatus === null
        ? Promise.resolve([])
        : prisma.receipt.findMany({
            where: {
              ...(receiptStatus ? { status: receiptStatus } : {}),
              ...(hasLocationScope ? { toLocation: locationScope } : {}),
              ...(filters.categoryId
                ? { lines: { some: { product: { categoryId: filters.categoryId } } } }
                : {}),
            },
            select: { status: true, scheduleDate: true },
          }),
      !selected("DELIVERY") || deliveryStatus === null
        ? Promise.resolve([])
        : prisma.deliveryOrder.findMany({
            where: {
              ...(deliveryStatus ? { status: deliveryStatus } : {}),
              ...(hasLocationScope ? { fromLocation: locationScope } : {}),
              ...(filters.categoryId
                ? { lines: { some: { product: { categoryId: filters.categoryId } } } }
                : {}),
            },
            select: { status: true, scheduleDate: true },
          }),
      !selected("TRANSFER") || transferStatus === null
        ? Promise.resolve([])
        : prisma.internalTransfer.findMany({
            where: {
              ...(transferStatus ? { status: transferStatus } : {}),
              ...(hasLocationScope
                ? { OR: [{ sourceLocation: locationScope }, { destinationLocation: locationScope }] }
                : {}),
              ...(filters.categoryId
                ? { lines: { some: { product: { categoryId: filters.categoryId } } } }
                : {}),
            },
            select: { status: true, scheduleDate: true },
          }),
      !selected("ADJUSTMENT") || adjustmentStatus === null
        ? Promise.resolve([])
        : prisma.stockAdjustment.findMany({
            where: {
              ...(adjustmentStatus ? { status: adjustmentStatus } : {}),
              ...(hasLocationScope ? { location: locationScope } : {}),
              ...(filters.categoryId ? { product: { categoryId: filters.categoryId } } : {}),
            },
            select: { status: true },
          }),
      prisma.warehouse.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, shortCode: true },
      }),
      prisma.location.findMany({
        where: filters.warehouseId ? { warehouseId: filters.warehouseId } : undefined,
        orderBy: [{ warehouse: { name: "asc" } }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          shortCode: true,
          warehouse: { select: { shortCode: true } },
        },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);

  const quantities = products.map((product) => ({
    productId: product.id,
    name: product.name,
    category: product.category?.name ?? "Uncategorized",
    reorderLevel: product.reorderLevel,
    onHand: product.stockEntries.reduce((total, entry) => total + Number(entry.onHand), 0),
    location: product.stockEntries[0]?.location?.name ?? "Unassigned",
  }));
  const transferSummary = summarizeOperations(transferRows, today);
  const summaries = ([
    {
      type: "RECEIPT",
      label: "Receipts",
      href: "/operations/receipts",
      ...summarizeOperations(receiptRows, today),
    },
    {
      type: "DELIVERY",
      label: "Delivery Orders",
      href: "/operations/delivery-orders",
      ...summarizeOperations(deliveryRows, today),
    },
    {
      type: "TRANSFER",
      label: "Internal Transfers",
      href: "/operations/internal-transfers",
      ...transferSummary,
    },
    {
      type: "ADJUSTMENT",
      label: "Stock Adjustments",
      href: "/operations/adjustments",
      ...summarizeOperations(
        adjustmentRows.map(({ status }) => ({ status, scheduleDate: null })),
        today
      ),
    },
  ] satisfies DashboardOperationSummary[]).filter(({ type }) => selected(type));

  const categoryTotals = new Map<string, number>();
  for (const product of quantities) {
    if (product.onHand > 0) {
      categoryTotals.set(product.category, (categoryTotals.get(product.category) ?? 0) + product.onHand);
    }
  }

  const movementWindow = new Date();
  movementWindow.setHours(0, 0, 0, 0);
  movementWindow.setDate(movementWindow.getDate() - 6);

  const movements = await prisma.stockMovement.findMany({
    where: {
      createdAt: { gte: movementWindow },
      ...(filters.locationId || filters.warehouseId
        ? {
            OR: [
              ...(filters.locationId ? [{ fromLocationId: filters.locationId }, { toLocationId: filters.locationId }] : []),
              ...(filters.warehouseId
                ? [{ fromLocation: { warehouseId: filters.warehouseId } }, { toLocation: { warehouseId: filters.warehouseId } }]
                : []),
            ],
          }
        : {}),
    },
    select: { createdAt: true, movementType: true, quantity: true },
    orderBy: { createdAt: "asc" },
  });

  const movementTrend: DashboardChartPoint[] = Array.from({ length: 7 }, (_, index) => {
    const target = new Date();
    target.setHours(0, 0, 0, 0);
    target.setDate(target.getDate() - (6 - index));

    const activeRows = movements.filter((movement) => {
      const created = new Date(movement.createdAt);
      created.setHours(0, 0, 0, 0);
      return created.getTime() === target.getTime();
    });

    const incoming = activeRows
      .filter(
        ({ movementType }) => movementType === "RECEIPT" || movementType === "TRANSFER_IN"
      )
      .reduce((total, movement) => total + Number(movement.quantity), 0);
    const outgoing = activeRows
      .filter(
        ({ movementType }) => movementType === "DELIVERY" || movementType === "TRANSFER_OUT"
      )
      .reduce((total, movement) => total + Number(movement.quantity), 0);

    return {
      date: target.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      incoming,
      outgoing,
      net: incoming - outgoing,
    };
  });

  const operationMix: DashboardChartSerie[] = summaries.map(({ type, label, total }) => ({
    name: label,
    value: total,
    fill: type === "RECEIPT" ? "#34d399" : type === "DELIVERY" ? "#f59e0b" : type === "TRANSFER" ? "#a78bfa" : "#38bdf8",
  }));

  const lowStockCandidates = quantities
    .filter(({ onHand, reorderLevel }) => onHand <= (reorderLevel ?? 0) || onHand === 0)
    .sort((a, b) => a.onHand - b.onHand);
  const lowStockItems: DashboardLowStockItem[] = [
    ...lowStockCandidates.filter(({ onHand }) => onHand === 0).slice(0, 2),
    ...lowStockCandidates.filter(({ onHand }) => onHand > 0).slice(0, 3),
  ].map((item) => ({
      name: item.name,
      category: item.category,
      onHand: item.onHand,
      reorderLevel: item.reorderLevel,
      location: item.location,
    }));

  return {
    kpis: {
      totalProductsInStock: quantities.filter(({ onHand }) => onHand > 0).length,
      lowOrOutOfStockItems: quantities.filter(
      ({ onHand, reorderLevel }) =>
        onHand === 0 || (reorderLevel !== null && onHand <= reorderLevel)
      ).length,
      pendingReceipts: summaries.find(({ type }) => type === "RECEIPT")?.pending ?? 0,
      pendingDeliveryOrders: summaries.find(({ type }) => type === "DELIVERY")?.pending ?? 0,
      scheduledInternalTransfers: transferRows.filter(
        ({ status, scheduleDate }) =>
          status !== "DONE" && status !== "CANCELED" && scheduleDate >= tomorrow
      ).length,
    },
    summaries,
    options: { warehouses, locations, categories },
    charts: {
      stockByCategory: [...categoryTotals.entries()].map(([name, value]) => ({
        name,
        value,
      })),
      movementTrend,
      operationMix,
      lowStockItems,
    },
  };
}