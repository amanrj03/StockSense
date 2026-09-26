"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema, categorySchema } from "@/lib/validations/product";

type ActionState = { error: string } | { success: string } | undefined;

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

// ─── Category actions ─────────────────────────────────────────────────────────

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const exists = await prisma.category.findUnique({ where: { name: parsed.data.name } });
  if (exists) return { error: "Category already exists" };

  await prisma.category.create({ data: { name: parsed.data.name } });
  revalidatePath("/products");
  return { success: "Category created" };
}

export async function deleteCategoryAction(id: string): Promise<ActionState> {
  await requireAuth();
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) return { error: "Cannot delete a category that has products" };
  await prisma.category.delete({ where: { id } });
  revalidatePath("/products");
  return { success: "Category deleted" };
}

// ─── Product actions ──────────────────────────────────────────────────────────

export async function createProductAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId") || undefined,
    unitOfMeasure: formData.get("unitOfMeasure"),
    perUnitCost: formData.get("perUnitCost"),
    reorderLevel: formData.get("reorderLevel") || null,
    reorderQty: formData.get("reorderQty") || null,
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { name, sku, categoryId, unitOfMeasure, perUnitCost, reorderLevel, reorderQty } = parsed.data;

  const exists = await prisma.product.findUnique({ where: { sku } });
  if (exists) return { error: `SKU "${sku}" is already in use` };

  await prisma.product.create({
    data: { name, sku, categoryId, unitOfMeasure, perUnitCost, reorderLevel, reorderQty },
  });

  revalidatePath("/products");
  return { success: "Product created" };
}

export async function updateProductAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing product ID" };

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId") || undefined,
    unitOfMeasure: formData.get("unitOfMeasure"),
    perUnitCost: formData.get("perUnitCost"),
    reorderLevel: formData.get("reorderLevel") || null,
    reorderQty: formData.get("reorderQty") || null,
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { name, sku, categoryId, unitOfMeasure, perUnitCost, reorderLevel, reorderQty } = parsed.data;

  const conflict = await prisma.product.findFirst({ where: { sku, NOT: { id } } });
  if (conflict) return { error: `SKU "${sku}" is already in use` };

  await prisma.product.update({
    where: { id },
    data: { name, sku, categoryId, unitOfMeasure, perUnitCost, reorderLevel, reorderQty },
  });

  revalidatePath("/products");
  return { success: "Product updated" };
}

export async function deleteProductAction(id: string): Promise<ActionState> {
  await requireAuth();

  const stockCount = await prisma.stock.count({ where: { productId: id } });
  if (stockCount > 0) return { error: "Cannot delete a product that has stock entries" };

  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
  return { success: "Product deleted" };
}
