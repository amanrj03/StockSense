// @vitest-environment node

import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const actionState = vi.hoisted(() => ({ client: undefined as unknown, userId: "" }));

vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return actionState.client;
  },
}));
vi.mock("@/lib/auth", () => ({
  auth: async () => ({ user: { id: actionState.userId } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`Redirected to ${path}`); },
}));

import { validateReceiptAction } from "@/lib/actions/receipt";
import {
  prepareDeliveryOrderAction,
  validateDeliveryOrderAction,
} from "@/lib/actions/delivery-order";
import { validateInternalTransferAction } from "@/lib/actions/internal-transfer";
import { validateStockAdjustmentAction } from "@/lib/actions/stock-adjustment";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

class RollbackFixture extends Error {}

const databaseUrl = process.env.DATABASE_URL;
const localHost = databaseUrl ? new URL(databaseUrl).hostname.toLowerCase() : "";
const isLocalDatabase = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(localHost);
let testPrisma: PrismaClient | undefined;

function createActionClient(tx: TxClient, failLedger = false): PrismaClient {
  const target = tx as unknown as Record<PropertyKey, unknown>;
  let savepointIndex = 0;
  const scopedClient = new Proxy(tx as unknown as PrismaClient, {
    get(_proxyTarget, property) {
      if (property === "$transaction") {
        return async (callback: (transaction: TxClient) => Promise<unknown>) => {
          const savepoint = `workflow_test_${++savepointIndex}`;
          await tx.$executeRawUnsafe(`SAVEPOINT ${savepoint}`);
          try {
            const result = await callback(scopedClient as unknown as TxClient);
            await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${savepoint}`);
            return result;
          } catch (error) {
            await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${savepoint}`);
            await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${savepoint}`);
            throw error;
          }
        };
      }

      const delegate = Reflect.get(target, property, target);
      if (property === "stockMovement" && failLedger) {
        return new Proxy(delegate as object, {
          get(model, method) {
            if (method === "create") {
              return async () => { throw new Error("Injected ledger failure"); };
            }
            return Reflect.get(model, method, model);
          },
        });
      }
      return delegate;
    },
  });

  return scopedClient;
}

async function createFixtures(tx: TxClient) {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
  const user = await tx.user.create({
    data: {
      loginId: `t${suffix.slice(0, 7)}`,
      email: `${suffix.toLowerCase()}@example.test`,
    },
  });
  const warehouse = await tx.warehouse.create({
    data: { name: `Workflow ${suffix}`, shortCode: `T${suffix.slice(0, 6)}` },
  });
  const source = await tx.location.create({
    data: { name: "Source", shortCode: "SRC", warehouseId: warehouse.id },
  });
  const destination = await tx.location.create({
    data: { name: "Destination", shortCode: "DST", warehouseId: warehouse.id },
  });
  const product = await tx.product.create({
    data: { name: `Workflow product ${suffix}`, sku: `T-${suffix}`, unitOfMeasure: "pcs" },
  });
  actionState.userId = user.id;
  return { user, warehouse, source, destination, product, suffix };
}

async function withRollback(
  run: (tx: TxClient, fixtures: Awaited<ReturnType<typeof createFixtures>>) => Promise<void>,
  failLedger = false
) {
  if (!testPrisma) throw new Error("Local PostgreSQL test client is unavailable");

  try {
    await testPrisma.$transaction(async (tx) => {
      const fixtures = await createFixtures(tx);
      actionState.client = createActionClient(tx, failLedger);
      await run(tx, fixtures);
      throw new RollbackFixture("Fixture rollback");
    });
  } catch (error) {
    if (!(error instanceof RollbackFixture)) throw error;
  } finally {
    actionState.client = undefined;
    actionState.userId = "";
  }
}

describe.skipIf(!isLocalDatabase)("stock operation transactions on local PostgreSQL", () => {
  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for workflow integration tests");
    testPrisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  });

  afterAll(async () => {
    await testPrisma?.$disconnect();
  });

  it("receives stock and writes one linked movement transactionally", async () => {
    await withRollback(async (tx, fixture) => {
      const receipt = await tx.receipt.create({
        data: {
          reference: `TEST/IN/${fixture.suffix}`,
          toLocationId: fixture.destination.id,
          contact: "Workflow vendor",
          scheduleDate: new Date(),
          responsibleId: fixture.user.id,
          status: "READY",
          lines: { create: [{ productId: fixture.product.id, quantity: 12.5 }] },
        },
      });

      const result = await validateReceiptAction(receipt.id);
      expect(result).toEqual({ success: "Receipt validated — stock updated" });

      const updated = await tx.stock.findUnique({
        where: { productId_locationId: { productId: fixture.product.id, locationId: fixture.destination.id } },
      });
      const movements = await tx.stockMovement.findMany({ where: { receiptId: receipt.id } });
      const completed = await tx.receipt.findUnique({ where: { id: receipt.id }, select: { status: true } });
      expect(Number(updated?.onHand)).toBe(12.5);
      expect(Number(updated?.reserved)).toBe(0);
      expect(completed?.status).toBe("DONE");
      expect(movements).toHaveLength(1);
      expect(movements[0]).toMatchObject({
        movementType: "RECEIPT",
        sourceType: "RECEIPT",
        toLocationId: fixture.destination.id,
        receiptId: receipt.id,
      });
      expect(Number(movements[0].quantity)).toBe(12.5);
    });
  });

  it("rolls back receipt status and stock if its ledger insert fails", async () => {
    await withRollback(async (tx, fixture) => {
      const receipt = await tx.receipt.create({
        data: {
          reference: `TEST/IN/${fixture.suffix}`,
          toLocationId: fixture.destination.id,
          contact: "Workflow vendor",
          scheduleDate: new Date(),
          responsibleId: fixture.user.id,
          status: "READY",
          lines: { create: [{ productId: fixture.product.id, quantity: 4 }] },
        },
      });

      await expect(validateReceiptAction(receipt.id)).rejects.toThrow("Injected ledger failure");
      const stock = await tx.stock.findUnique({
        where: { productId_locationId: { productId: fixture.product.id, locationId: fixture.destination.id } },
      });
      const movements = await tx.stockMovement.count({ where: { receiptId: receipt.id } });
      const unchanged = await tx.receipt.findUnique({ where: { id: receipt.id }, select: { status: true } });
      expect(stock).toBeNull();
      expect(movements).toBe(0);
      expect(unchanged?.status).toBe("READY");
    }, true);
  });

  it("reserves free stock when a Delivery Order becomes Ready", async () => {
    await withRollback(async (tx, fixture) => {
      await tx.stock.create({
        data: { productId: fixture.product.id, locationId: fixture.source.id, onHand: 20, reserved: 5 },
      });
      const order = await tx.deliveryOrder.create({
        data: {
          reference: `TEST/OUT/${fixture.suffix}`,
          fromLocationId: fixture.source.id,
          contact: "Workflow customer",
          scheduleDate: new Date(),
          responsibleId: fixture.user.id,
          status: "DRAFT",
          lines: { create: [{ productId: fixture.product.id, quantity: 4 }] },
        },
      });

      const result = await prepareDeliveryOrderAction(order.id);
      const stock = await tx.stock.findUnique({ where: { productId_locationId: { productId: fixture.product.id, locationId: fixture.source.id } } });
      const updated = await tx.deliveryOrder.findUnique({ where: { id: order.id }, select: { status: true } });
      expect(result).toEqual({ success: "Delivery Order is ready to pick" });
      expect(Number(stock?.onHand)).toBe(20);
      expect(Number(stock?.reserved)).toBe(9);
      expect(updated?.status).toBe("READY");
    });
  });

  it("keeps insufficient Delivery Orders waiting without reserving stock", async () => {
    await withRollback(async (tx, fixture) => {
      await tx.stock.create({
        data: { productId: fixture.product.id, locationId: fixture.source.id, onHand: 5, reserved: 4 },
      });
      const order = await tx.deliveryOrder.create({
        data: {
          reference: `TEST/OUT/${fixture.suffix}`,
          fromLocationId: fixture.source.id,
          contact: "Workflow customer",
          scheduleDate: new Date(),
          responsibleId: fixture.user.id,
          status: "DRAFT",
          lines: { create: [{ productId: fixture.product.id, quantity: 2 }] },
        },
      });

      const result = await prepareDeliveryOrderAction(order.id);
      const stock = await tx.stock.findUnique({ where: { productId_locationId: { productId: fixture.product.id, locationId: fixture.source.id } } });
      const updated = await tx.deliveryOrder.findUnique({ where: { id: order.id }, select: { status: true } });
      expect(result).toEqual({ success: "Waiting for sufficient stock" });
      expect(Number(stock?.reserved)).toBe(4);
      expect(updated?.status).toBe("WAITING");
    });
  });

  it("decrements reserved stock and records a Delivery movement on completion", async () => {
    await withRollback(async (tx, fixture) => {
      await tx.stock.create({
        data: { productId: fixture.product.id, locationId: fixture.source.id, onHand: 20, reserved: 4 },
      });
      const order = await tx.deliveryOrder.create({
        data: {
          reference: `TEST/OUT/${fixture.suffix}`,
          fromLocationId: fixture.source.id,
          contact: "Workflow customer",
          scheduleDate: new Date(),
          responsibleId: fixture.user.id,
          status: "READY",
          pickedAt: new Date(),
          packedAt: new Date(),
          lines: { create: [{ productId: fixture.product.id, quantity: 4 }] },
        },
      });

      const result = await validateDeliveryOrderAction(order.id);
      const stock = await tx.stock.findUnique({ where: { productId_locationId: { productId: fixture.product.id, locationId: fixture.source.id } } });
      const movements = await tx.stockMovement.findMany({ where: { deliveryOrderId: order.id } });
      const completed = await tx.deliveryOrder.findUnique({ where: { id: order.id }, select: { status: true } });
      expect(result).toEqual({ success: "Delivery Order validated — stock updated" });
      expect(Number(stock?.onHand)).toBe(16);
      expect(Number(stock?.reserved)).toBe(0);
      expect(completed?.status).toBe("DONE");
      expect(movements).toHaveLength(1);
      expect(movements[0]).toMatchObject({ movementType: "DELIVERY", fromLocationId: fixture.source.id });
    });
  });

  it("moves stock between locations and writes paired transfer movements", async () => {
    await withRollback(async (tx, fixture) => {
      await tx.stock.create({
        data: { productId: fixture.product.id, locationId: fixture.source.id, onHand: 20, reserved: 2 },
      });
      const transfer = await tx.internalTransfer.create({
        data: {
          reference: `TEST/INT/${fixture.suffix}`,
          sourceLocationId: fixture.source.id,
          destinationLocationId: fixture.destination.id,
          scheduleDate: new Date(),
          responsibleId: fixture.user.id,
          status: "READY",
          lines: { create: [{ productId: fixture.product.id, quantity: 6 }] },
        },
      });

      const result = await validateInternalTransferAction(transfer.id);
      const source = await tx.stock.findUnique({ where: { productId_locationId: { productId: fixture.product.id, locationId: fixture.source.id } } });
      const destination = await tx.stock.findUnique({ where: { productId_locationId: { productId: fixture.product.id, locationId: fixture.destination.id } } });
      const movements = await tx.stockMovement.findMany({ where: { transferId: transfer.id }, orderBy: { movementType: "asc" } });
      const completed = await tx.internalTransfer.findUnique({ where: { id: transfer.id }, select: { status: true } });
      expect(result).toEqual({ success: "Internal Transfer validated — stock relocated" });
      expect(Number(source?.onHand)).toBe(14);
      expect(Number(destination?.onHand)).toBe(6);
      expect(Number(source?.onHand) + Number(destination?.onHand)).toBe(20);
      expect(completed?.status).toBe("DONE");
      expect(movements.map((movement) => movement.movementType).sort()).toEqual(["TRANSFER_IN", "TRANSFER_OUT"]);
      expect(movements.every((movement) => Number(movement.quantity) === 6)).toBe(true);
    });
  });

  it("applies a stock adjustment and records the negative movement direction", async () => {
    await withRollback(async (tx, fixture) => {
      await tx.stock.create({
        data: { productId: fixture.product.id, locationId: fixture.source.id, onHand: 10, reserved: 2 },
      });
      const adjustment = await tx.stockAdjustment.create({
        data: {
          reference: `TEST/ADJ/${fixture.suffix}`,
          locationId: fixture.source.id,
          productId: fixture.product.id,
          systemQuantity: 10,
          physicalQuantity: 8,
          difference: -2,
          reason: "MISCOUNT",
          responsibleId: fixture.user.id,
          status: "DRAFT",
        },
      });

      const result = await validateStockAdjustmentAction(adjustment.id);
      const stock = await tx.stock.findUnique({ where: { productId_locationId: { productId: fixture.product.id, locationId: fixture.source.id } } });
      const movements = await tx.stockMovement.findMany({ where: { adjustmentId: adjustment.id } });
      const completed = await tx.stockAdjustment.findUnique({ where: { id: adjustment.id }, select: { status: true } });
      expect(result).toEqual({ success: "Stock Adjustment validated — stock and ledger updated" });
      expect(Number(stock?.onHand)).toBe(8);
      expect(completed?.status).toBe("DONE");
      expect(movements).toHaveLength(1);
      expect(movements[0]).toMatchObject({ fromLocationId: fixture.source.id, toLocationId: null });
      expect(Number(movements[0].quantity)).toBe(2);
    });
  });

  it("rejects an adjustment below reserved stock without changing stock or ledger", async () => {
    await withRollback(async (tx, fixture) => {
      await tx.stock.create({
        data: { productId: fixture.product.id, locationId: fixture.source.id, onHand: 10, reserved: 3 },
      });
      const adjustment = await tx.stockAdjustment.create({
        data: {
          reference: `TEST/ADJ/${fixture.suffix}`,
          locationId: fixture.source.id,
          productId: fixture.product.id,
          systemQuantity: 10,
          physicalQuantity: 2,
          difference: -8,
          reason: "DAMAGED",
          responsibleId: fixture.user.id,
          status: "DRAFT",
        },
      });

      const result = await validateStockAdjustmentAction(adjustment.id);
      const stock = await tx.stock.findUnique({ where: { productId_locationId: { productId: fixture.product.id, locationId: fixture.source.id } } });
      const movementCount = await tx.stockMovement.count({ where: { adjustmentId: adjustment.id } });
      const unchanged = await tx.stockAdjustment.findUnique({ where: { id: adjustment.id }, select: { status: true } });
      expect(result).toEqual({ error: "Physical quantity cannot be below stock reserved for delivery" });
      expect(Number(stock?.onHand)).toBe(10);
      expect(movementCount).toBe(0);
      expect(unchanged?.status).toBe("DRAFT");
    });
  });
});