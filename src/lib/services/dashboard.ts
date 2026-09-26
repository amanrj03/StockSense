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
          reorderLevel: true,
          stockEntries: {
            where: {
              ...(filters.locationId ? { locationId: filters.locationId } : {}),
              ...(filters.warehouseId ? { location: { warehouseId: filters.warehouseId } } : {}),
            },
            select: { onHand: true },
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
    reorderLevel: product.reorderLevel,
    onHand: product.stockEntries.reduce((total, entry) => total + Number(entry.onHand), 0),
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
  };
}