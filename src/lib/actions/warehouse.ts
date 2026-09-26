"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { warehouseSchema } from "@/lib/validations/warehouse";

type ActionState = { error: string } | { success: string } | undefined;

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createWarehouseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();

  const parsed = warehouseSchema.safeParse({
    name: formData.get("name"),
    shortCode: formData.get("shortCode"),
    address: formData.get("address") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, shortCode, address } = parsed.data;

  const exists = await prisma.warehouse.findUnique({ where: { shortCode } });
  if (exists) return { error: `Short code "${shortCode}" is already in use` };

  await prisma.warehouse.create({ data: { name, shortCode, address } });
  revalidatePath("/settings/warehouses");
  return { success: "Warehouse created" };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateWarehouseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing warehouse ID" };

  const parsed = warehouseSchema.safeParse({
    name: formData.get("name"),
    shortCode: formData.get("shortCode"),
    address: formData.get("address") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, shortCode, address } = parsed.data;

  const conflict = await prisma.warehouse.findFirst({
    where: { shortCode, NOT: { id } },
  });
  if (conflict) return { error: `Short code "${shortCode}" is already in use` };

  await prisma.warehouse.update({ where: { id }, data: { name, shortCode, address } });
  revalidatePath("/settings/warehouses");
  return { success: "Warehouse updated" };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteWarehouseAction(id: string): Promise<ActionState> {
  await requireAuth();

  const locationCount = await prisma.location.count({ where: { warehouseId: id } });
  if (locationCount > 0) {
    return { error: "Cannot delete a warehouse that has locations. Remove all locations first." };
  }

  await prisma.warehouse.delete({ where: { id } });
  revalidatePath("/settings/warehouses");
  return { success: "Warehouse deleted" };
}
