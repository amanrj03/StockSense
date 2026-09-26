"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { locationSchema } from "@/lib/validations/warehouse";

type ActionState = { error: string } | { success: string } | undefined;

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createLocationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();

  const parsed = locationSchema.safeParse({
    name: formData.get("name"),
    shortCode: formData.get("shortCode"),
    warehouseId: formData.get("warehouseId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, shortCode, warehouseId } = parsed.data;

  const exists = await prisma.location.findFirst({
    where: { shortCode, warehouseId },
  });
  if (exists) return { error: `Short code "${shortCode}" already exists in this warehouse` };

  await prisma.location.create({ data: { name, shortCode, warehouseId } });
  revalidatePath("/settings/locations");
  return { success: "Location created" };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateLocationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing location ID" };

  const parsed = locationSchema.safeParse({
    name: formData.get("name"),
    shortCode: formData.get("shortCode"),
    warehouseId: formData.get("warehouseId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, shortCode, warehouseId } = parsed.data;

  const conflict = await prisma.location.findFirst({
    where: { shortCode, warehouseId, NOT: { id } },
  });
  if (conflict) return { error: `Short code "${shortCode}" already exists in this warehouse` };

  await prisma.location.update({ where: { id }, data: { name, shortCode, warehouseId } });
  revalidatePath("/settings/locations");
  return { success: "Location updated" };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteLocationAction(id: string): Promise<ActionState> {
  await requireAuth();

  const [stockCount, receipts, deliveries, sourceTransfers, destinationTransfers, adjustments, movementsFrom, movementsTo] =
    await Promise.all([
      prisma.stock.count({ where: { locationId: id } }),
      prisma.receipt.count({ where: { toLocationId: id } }),
      prisma.deliveryOrder.count({ where: { fromLocationId: id } }),
      prisma.internalTransfer.count({ where: { sourceLocationId: id } }),
      prisma.internalTransfer.count({ where: { destinationLocationId: id } }),
      prisma.stockAdjustment.count({ where: { locationId: id } }),
      prisma.stockMovement.count({ where: { fromLocationId: id } }),
      prisma.stockMovement.count({ where: { toLocationId: id } }),
    ]);
  if (stockCount > 0) {
    return { error: "Cannot delete a location that has stock. Perform a stock adjustment first." };
  }
  if (receipts + deliveries + sourceTransfers + destinationTransfers + adjustments + movementsFrom + movementsTo > 0) {
    return { error: "Cannot delete a location referenced by operations or movement history" };
  }

  const deleted = await prisma.location.deleteMany({ where: { id } });
  if (deleted.count !== 1) return { error: "Location no longer exists" };
  revalidatePath("/settings/locations");
  return { success: "Location deleted" };
}
