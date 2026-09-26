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

  // Prevent deletion if stock or operations reference this location
  const stockCount = await prisma.stock.count({ where: { locationId: id } });
  if (stockCount > 0) {
    return { error: "Cannot delete a location that has stock. Perform a stock adjustment first." };
  }

  await prisma.location.delete({ where: { id } });
  revalidatePath("/settings/locations");
  return { success: "Location deleted" };
}
