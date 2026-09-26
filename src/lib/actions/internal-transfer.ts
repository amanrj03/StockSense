"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/services/reference";
import { internalTransferSchema } from "@/lib/validations/internal-transfer";

type ActionState = { error: string } | { success: string } | undefined;
type Demand = { productId: string; quantity: number };

class TransferWorkflowError extends Error {}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

function parseLines(formData: FormData): unknown[] | { error: string } {
  const raw = formData.get("lines");
  if (typeof raw !== "string") return { error: "Invalid product lines" };
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value : { error: "Invalid product lines" };
  } catch {
    return { error: "Invalid product lines" };
  }
}

function aggregateDemand(lines: { productId: string; quantity: number }[]): Demand[] {
  const totals = new Map<string, number>();
  for (const line of lines) {
    totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);
  }
  return [...totals].map(([productId, quantity]) => ({ productId, quantity }));
}

function revalidateTransferPaths(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/operations/internal-transfers");
  revalidatePath("/stock");
  revalidatePath("/move-history");
  if (id) revalidatePath(`/operations/internal-transfers/${id}`);
}

export async function createInternalTransferAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAuth();
  const lines = parseLines(formData);
  if ("error" in lines) return lines;

  const parsed = internalTransferSchema.safeParse({
    sourceLocationId: formData.get("sourceLocationId"),
    destinationLocationId: formData.get("destinationLocationId"),
    scheduleDate: formData.get("scheduleDate"),
    lines,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (parsed.data.sourceLocationId === parsed.data.destinationLocationId) {
    return { error: "Source and destination locations must be different" };
  }

  const source = await prisma.location.findUnique({
    where: { id: parsed.data.sourceLocationId },
    select: { warehouseId: true },
  });
  const destinationExists = await prisma.location.findUnique({
    where: { id: parsed.data.destinationLocationId },
    select: { id: true },
  });
  if (!source || !destinationExists) return { error: "Source or destination location not found" };

  const transfer = await prisma.$transaction(async (tx) => {
    const reference = await generateReference(tx, source.warehouseId, "INT");
    return tx.internalTransfer.create({
      data: {
        reference,
        sourceLocationId: parsed.data.sourceLocationId,
        destinationLocationId: parsed.data.destinationLocationId,
        scheduleDate: new Date(parsed.data.scheduleDate),
        responsibleId: user.id!,
        status: "DRAFT",
        lines: { create: parsed.data.lines },
      },
    });
  });

  revalidateTransferPaths(transfer.id);
  redirect(`/operations/internal-transfers/${transfer.id}`);
}

export async function markInternalTransferReadyAction(id: string): Promise<ActionState> {
  await requireAuth();

  const transfer = await prisma.internalTransfer.findUnique({
    where: { id },
    select: {
      status: true,
      sourceLocationId: true,
      lines: { select: { productId: true, quantity: true } },
    },
  });
  if (!transfer) return { error: "Internal Transfer not found" };
  if (transfer.status !== "DRAFT") return { error: "Only Draft transfers can be marked Ready" };
  if (transfer.lines.length === 0) return { error: "Internal Transfer has no product lines" };

  const demand = aggregateDemand(transfer.lines.map((line) => ({
    productId: line.productId,
    quantity: Number(line.quantity),
  })));
  const stocks = await Promise.all(demand.map((line) =>
    prisma.stock.findUnique({
      where: {
        productId_locationId: {
          productId: line.productId,
          locationId: transfer.sourceLocationId,
        },
      },
      select: { onHand: true, reserved: true },
    })
  ));
  const unavailable = demand.some((line, index) => {
    const stock = stocks[index];
    return !stock || stock.onHand.minus(stock.reserved).lessThan(line.quantity);
  });
  if (unavailable) return { error: "Insufficient free stock at the source location" };

  const updated = await prisma.internalTransfer.updateMany({
    where: { id, status: "DRAFT" },
    data: { status: "READY" },
  });
  if (updated.count !== 1) return { error: "Transfer changed; reload and try again" };
  revalidateTransferPaths(id);
  return { success: "Internal Transfer marked Ready" };
}

export async function validateInternalTransferAction(id: string): Promise<ActionState> {
  await requireAuth();

  try {
    await prisma.$transaction(async (tx) => {
      const transfer = await tx.internalTransfer.findUnique({
        where: { id },
        select: {
          status: true,
          sourceLocationId: true,
          destinationLocationId: true,
          lines: { select: { productId: true, quantity: true } },
        },
      });
      if (!transfer) throw new TransferWorkflowError("Internal Transfer not found");
      if (transfer.status !== "READY") {
        throw new TransferWorkflowError("Only Ready transfers can be validated");
      }
      if (transfer.lines.length === 0) {
        throw new TransferWorkflowError("Internal Transfer has no product lines");
      }

      const demand = aggregateDemand(transfer.lines.map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
      })));
      const sourceStocks = await Promise.all(demand.map((line) =>
        tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.sourceLocationId,
            },
          },
          select: { onHand: true, reserved: true },
        })
      ));

      for (let index = 0; index < demand.length; index += 1) {
        const line = demand[index];
        const stock = sourceStocks[index];
        if (!stock || stock.onHand.minus(stock.reserved).lessThan(line.quantity)) {
          throw new TransferWorkflowError("Free stock changed; transfer was not completed");
        }

        const updated = await tx.stock.updateMany({
          where: {
            productId: line.productId,
            locationId: transfer.sourceLocationId,
            onHand: { gte: line.quantity },
            reserved: { lte: stock.onHand.minus(line.quantity) },
          },
          data: { onHand: { decrement: line.quantity } },
        });
        if (updated.count !== 1) {
          throw new TransferWorkflowError("Free stock changed; transfer was not completed");
        }

        await tx.stock.upsert({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.destinationLocationId,
            },
          },
          update: { onHand: { increment: line.quantity } },
          create: {
            productId: line.productId,
            locationId: transfer.destinationLocationId,
            onHand: line.quantity,
            reserved: 0,
          },
        });
      }

      const updated = await tx.internalTransfer.updateMany({
        where: { id, status: "READY" },
        data: { status: "DONE" },
      });
      if (updated.count !== 1) {
        throw new TransferWorkflowError("Transfer changed; reload before validating");
      }

      for (const line of transfer.lines) {
        await tx.stockMovement.createMany({
          data: [
            {
              movementType: "TRANSFER_OUT",
              sourceType: "TRANSFER",
              productId: line.productId,
              fromLocationId: transfer.sourceLocationId,
              quantity: line.quantity,
              transferId: id,
            },
            {
              movementType: "TRANSFER_IN",
              sourceType: "TRANSFER",
              productId: line.productId,
              toLocationId: transfer.destinationLocationId,
              quantity: line.quantity,
              transferId: id,
            },
          ],
        });
      }
    });
  } catch (error) {
    if (error instanceof TransferWorkflowError) return { error: error.message };
    throw error;
  }

  revalidateTransferPaths(id);
  return { success: "Internal Transfer validated — stock relocated" };
}

export async function cancelInternalTransferAction(id: string): Promise<ActionState> {
  await requireAuth();
  const transfer = await prisma.internalTransfer.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!transfer) return { error: "Internal Transfer not found" };
  if (transfer.status === "DONE") return { error: "Cannot cancel a completed transfer" };
  if (transfer.status === "CANCELED") return { error: "Transfer is already canceled" };

  const updated = await prisma.internalTransfer.updateMany({
    where: { id, status: transfer.status },
    data: { status: "CANCELED" },
  });
  if (updated.count !== 1) return { error: "Transfer changed; reload and try again" };
  revalidateTransferPaths(id);
  return { success: "Internal Transfer canceled" };
}