"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { receiptSchema } from "@/lib/validations/receipt";
import { generateReference } from "@/lib/services/reference";

type ActionState = { error: string } | { success: string } | undefined;
class ReceiptWorkflowError extends Error {}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

// ─── Create Receipt (Draft) ───────────────────────────────────────────────────

export async function createReceiptAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAuth();

  // Parse lines from formData (serialized as JSON)
  const linesRaw = formData.get("lines");
  let lines: unknown[] = [];
  try {
    lines = JSON.parse(linesRaw as string);
  } catch {
    return { error: "Invalid product lines" };
  }

  const parsed = receiptSchema.safeParse({
    toLocationId: formData.get("toLocationId"),
    contact: formData.get("contact"),
    scheduleDate: formData.get("scheduleDate"),
    lines,
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { toLocationId, contact, scheduleDate, lines: validLines } = parsed.data;

  // Derive warehouseId from the location
  const location = await prisma.location.findUnique({
    where: { id: toLocationId },
    select: { warehouseId: true },
  });
  if (!location) return { error: "Location not found" };

  const receipt = await prisma.$transaction(async (tx) => {
    const reference = await generateReference(tx, location.warehouseId, "IN");
    return tx.receipt.create({
      data: {
        reference,
        toLocationId,
        contact,
        scheduleDate: new Date(scheduleDate),
        responsibleId: user.id!,
        status: "DRAFT",
        lines: {
          create: validLines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
        },
      },
    });
  });

  revalidatePath("/operations/receipts");
  redirect(`/operations/receipts/${receipt.id}`);
}

// ─── Mark Ready (Draft → Ready) ───────────────────────────────────────────────

export async function markReceiptReadyAction(id: string): Promise<ActionState> {
  await requireAuth();

  const receipt = await prisma.receipt.findUnique({ where: { id }, select: { status: true } });
  if (!receipt) return { error: "Receipt not found" };
  if (receipt.status !== "DRAFT") return { error: "Only Draft receipts can be marked Ready" };

  await prisma.receipt.update({ where: { id }, data: { status: "READY" } });
  revalidatePath(`/operations/receipts/${id}`);
  revalidatePath("/operations/receipts");
  return { success: "Receipt marked as Ready" };
}

// ─── Validate Receipt (Ready → Done) — increases stock ───────────────────────

export async function validateReceiptAction(id: string): Promise<ActionState> {
  await requireAuth();

  const receipt = await prisma.receipt.findUnique({
    where: { id },
    select: {
      status: true,
      toLocationId: true,
      lines: { select: { productId: true, quantity: true } },
    },
  });

  if (!receipt) return { error: "Receipt not found" };
  if (receipt.status !== "READY") return { error: "Only Ready receipts can be validated" };
  if (receipt.lines.length === 0) return { error: "Receipt has no product lines" };

  try {
    await prisma.$transaction(async (tx) => {
    // 1. Mark receipt as Done
    const changed = await tx.receipt.updateMany({
      where: { id, status: "READY" },
      data: { status: "DONE" },
    });
    if (changed.count !== 1) {
      throw new ReceiptWorkflowError("Receipt changed; reload before validating");
    }

    // 2. For each line: upsert Stock + create StockMovement
    for (const line of receipt.lines) {
      const qty = line.quantity;

      // Upsert stock row — increment onHand
      await tx.stock.upsert({
        where: {
          productId_locationId: {
            productId: line.productId,
            locationId: receipt.toLocationId,
          },
        },
        update: { onHand: { increment: qty } },
        create: {
          productId: line.productId,
          locationId: receipt.toLocationId,
          onHand: qty,
          reserved: 0,
        },
      });

      // Create ledger entry
      await tx.stockMovement.create({
        data: {
          movementType: "RECEIPT",
          sourceType: "RECEIPT",
          productId: line.productId,
          toLocationId: receipt.toLocationId,
          quantity: qty,
          receiptId: id,
        },
      });
    }
    });
  } catch (error) {
    if (error instanceof ReceiptWorkflowError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/operations/receipts/${id}`);
  revalidatePath("/operations/receipts");
  revalidatePath("/stock");
  return { success: "Receipt validated — stock updated" };
}

// ─── Cancel Receipt ───────────────────────────────────────────────────────────

export async function cancelReceiptAction(id: string): Promise<ActionState> {
  await requireAuth();

  const receipt = await prisma.receipt.findUnique({ where: { id }, select: { status: true } });
  if (!receipt) return { error: "Receipt not found" };
  if (receipt.status === "DONE") return { error: "Cannot cancel a completed receipt" };

  await prisma.receipt.update({ where: { id }, data: { status: "CANCELED" } });
  revalidatePath(`/operations/receipts/${id}`);
  revalidatePath("/operations/receipts");
  return { success: "Receipt canceled" };
}
