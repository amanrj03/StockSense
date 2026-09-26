"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/services/reference";
import { stockAdjustmentSchema } from "@/lib/validations/stock-adjustment";

type ActionState = { error: string } | { success: string } | undefined;

class AdjustmentWorkflowError extends Error {}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

function revalidateAdjustmentPaths(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/operations/adjustments");
  revalidatePath("/stock");
  revalidatePath("/move-history");
  if (id) revalidatePath(`/operations/adjustments/${id}`);
}

export async function createStockAdjustmentAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAuth();
  const parsed = stockAdjustmentSchema.safeParse({
    locationId: formData.get("locationId"),
    productId: formData.get("productId"),
    physicalQuantity: formData.get("physicalQuantity"),
    reason: formData.get("reason"),
    reasonNote: formData.get("reasonNote") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const location = await prisma.location.findUnique({
    where: { id: parsed.data.locationId },
    select: { warehouseId: true },
  });
  if (!location) return { error: "Location not found" };

  const adjustment = await prisma.$transaction(async (tx) => {
    const stock = await tx.stock.findUnique({
      where: {
        productId_locationId: {
          productId: parsed.data.productId,
          locationId: parsed.data.locationId,
        },
      },
      select: { onHand: true },
    });
    const systemQuantity = Number(stock?.onHand ?? 0);
    const difference = parsed.data.physicalQuantity - systemQuantity;
    const reference = await generateReference(tx, location.warehouseId, "ADJ");

    return tx.stockAdjustment.create({
      data: {
        reference,
        locationId: parsed.data.locationId,
        productId: parsed.data.productId,
        systemQuantity,
        physicalQuantity: parsed.data.physicalQuantity,
        difference,
        reason: parsed.data.reason,
        reasonNote: parsed.data.reason === "OTHER" ? parsed.data.reasonNote || null : null,
        responsibleId: user.id!,
        status: "DRAFT",
      },
    });
  });

  revalidateAdjustmentPaths(adjustment.id);
  redirect(`/operations/adjustments/${adjustment.id}`);
}

export async function validateStockAdjustmentAction(id: string): Promise<ActionState> {
  await requireAuth();

  try {
    await prisma.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.findUnique({
        where: { id },
        select: {
          status: true,
          productId: true,
          locationId: true,
          systemQuantity: true,
          physicalQuantity: true,
          difference: true,
        },
      });
      if (!adjustment) throw new AdjustmentWorkflowError("Stock Adjustment not found");
      if (adjustment.status !== "DRAFT") {
        throw new AdjustmentWorkflowError("Only Draft adjustments can be validated");
      }

      const stock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: adjustment.productId,
            locationId: adjustment.locationId,
          },
        },
        select: { onHand: true, reserved: true },
      });
      const stockChanged = stock
        ? !stock.onHand.equals(adjustment.systemQuantity)
        : !adjustment.systemQuantity.equals(0);
      if (stockChanged) {
        throw new AdjustmentWorkflowError("Stock changed since this count was drafted; recount before validating");
      }
      if (stock && adjustment.physicalQuantity.lessThan(stock.reserved)) {
        throw new AdjustmentWorkflowError("Physical quantity cannot be below stock reserved for delivery");
      }

      if (adjustment.difference.greaterThan(0)) {
        if (stock) {
          const updated = await tx.stock.updateMany({
            where: {
              productId: adjustment.productId,
              locationId: adjustment.locationId,
              onHand: adjustment.systemQuantity,
              reserved: { lte: adjustment.physicalQuantity },
            },
            data: { onHand: adjustment.physicalQuantity },
          });
          if (updated.count !== 1) {
            throw new AdjustmentWorkflowError("Stock changed during validation; reload and recount");
          }
        } else {
          await tx.stock.create({
            data: {
              productId: adjustment.productId,
              locationId: adjustment.locationId,
              onHand: adjustment.physicalQuantity,
              reserved: 0,
            },
          });
        }
      } else if (adjustment.difference.lessThan(0)) {
        if (!stock) throw new AdjustmentWorkflowError("Stock record changed; recount before validating");
        const updated = await tx.stock.updateMany({
          where: {
            productId: adjustment.productId,
            locationId: adjustment.locationId,
            onHand: adjustment.systemQuantity,
            reserved: { lte: adjustment.physicalQuantity },
          },
          data: { onHand: adjustment.physicalQuantity },
        });
        if (updated.count !== 1) {
          throw new AdjustmentWorkflowError("Stock changed during validation; reload and recount");
        }
      }

      if (!adjustment.difference.equals(0)) {
        await tx.stockMovement.create({
          data: {
            movementType: "ADJUSTMENT",
            sourceType: "ADJUSTMENT",
            productId: adjustment.productId,
            fromLocationId: adjustment.difference.lessThan(0) ? adjustment.locationId : null,
            toLocationId: adjustment.difference.greaterThan(0) ? adjustment.locationId : null,
            quantity: adjustment.difference.abs(),
            adjustmentId: id,
          },
        });
      }

      const updatedAdjustment = await tx.stockAdjustment.updateMany({
        where: { id, status: "DRAFT" },
        data: { status: "DONE" },
      });
      if (updatedAdjustment.count !== 1) {
        throw new AdjustmentWorkflowError("Adjustment changed; reload before validating");
      }
    });
  } catch (error) {
    if (error instanceof AdjustmentWorkflowError) return { error: error.message };
    throw error;
  }

  revalidateAdjustmentPaths(id);
  return { success: "Stock Adjustment validated — stock and ledger updated" };
}