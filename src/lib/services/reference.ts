import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@/generated/prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Atomically increments the OperationCounter for a warehouse+opCode
 * and returns the formatted reference string.
 *
 * Must be called inside a Prisma transaction.
 *
 * e.g. generateReference(tx, warehouseId, "IN") → "WH/IN/0001"
 */
export async function generateReference(
  tx: TxClient,
  warehouseId: string,
  opCode: "IN" | "OUT" | "INT" | "ADJ"
): Promise<string> {
  const warehouse = await tx.warehouse.findUniqueOrThrow({
    where: { id: warehouseId },
    select: { shortCode: true },
  });

  // Upsert the counter row and increment atomically
  const counter = await tx.operationCounter.upsert({
    where: { warehouseId_opCode: { warehouseId, opCode } },
    update: { lastSeq: { increment: 1 } },
    create: { warehouseId, opCode, lastSeq: 1 },
    select: { lastSeq: true },
  });

  const seq = String(counter.lastSeq).padStart(4, "0");
  return `${warehouse.shortCode}/${opCode}/${seq}`;
}
