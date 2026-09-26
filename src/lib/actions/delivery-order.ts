"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/services/reference";
import { deliveryOrderSchema } from "@/lib/validations/delivery-order";

type ActionState = { error: string } | { success: string } | undefined;
type Demand = { productId: string; quantity: number };

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

function revalidateDeliveryPaths(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/operations/delivery-orders");
  revalidatePath("/stock");
  revalidatePath("/move-history");
  if (id) revalidatePath(`/operations/delivery-orders/${id}`);
}

export async function createDeliveryOrderAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAuth();
  const lines = parseLines(formData);
  if ("error" in lines) return lines;

  const parsed = deliveryOrderSchema.safeParse({
    fromLocationId: formData.get("fromLocationId"),
    contact: formData.get("contact"),
    deliveryAddress: formData.get("deliveryAddress") ?? "",
    operationType: formData.get("operationType") ?? "",
    scheduleDate: formData.get("scheduleDate"),
    lines,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const location = await prisma.location.findUnique({
    where: { id: parsed.data.fromLocationId },
    select: { warehouseId: true },
  });
  if (!location) return { error: "Source location not found" };

  const order = await prisma.$transaction(async (tx) => {
    const reference = await generateReference(tx, location.warehouseId, "OUT");
    return tx.deliveryOrder.create({
      data: {
        reference,
        fromLocationId: parsed.data.fromLocationId,
        contact: parsed.data.contact,
        deliveryAddress: parsed.data.deliveryAddress || null,
        operationType: parsed.data.operationType ?? null,
        scheduleDate: new Date(parsed.data.scheduleDate),
        responsibleId: user.id!,
        status: "DRAFT",
        lines: { create: parsed.data.lines },
      },
    });
  });

  revalidateDeliveryPaths(order.id);
  redirect(`/operations/delivery-orders/${order.id}`);
}

export async function prepareDeliveryOrderAction(id: string): Promise<ActionState> {
  await requireAuth();

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.deliveryOrder.findUnique({
      where: { id },
      select: {
        status: true,
        fromLocationId: true,
        lines: { select: { productId: true, quantity: true } },
      },
    });
    if (!order) return { error: "Delivery Order not found" } as const;
    if (order.status !== "DRAFT" && order.status !== "WAITING") {
      return { error: "Only Draft or Waiting orders can be prepared" } as const;
    }
    if (order.lines.length === 0) return { error: "Delivery Order has no product lines" } as const;

    const demand = aggregateDemand(order.lines.map((line) => ({
      productId: line.productId,
      quantity: Number(line.quantity),
    })));
    const stocks = await Promise.all(demand.map((line) =>
      tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: line.productId,
            locationId: order.fromLocationId,
          },
        },
        select: { onHand: true, reserved: true },
      })
    ));
    const unavailable = demand.some((line, index) => {
      const stock = stocks[index];
      return !stock || stock.onHand.minus(stock.reserved).lessThan(line.quantity);
    });

    if (unavailable) {
      await tx.deliveryOrder.update({ where: { id }, data: { status: "WAITING" } });
      return { waiting: true } as const;
    }

    for (let index = 0; index < demand.length; index += 1) {
      const line = demand[index];
      const stock = stocks[index];
      if (!stock) throw new Error("Stock changed while preparing the delivery order");

      const update = await tx.stock.updateMany({
        where: {
          productId: line.productId,
          locationId: order.fromLocationId,
          onHand: { gte: line.quantity },
          reserved: { lte: stock.onHand.minus(line.quantity) },
        },
        data: { reserved: { increment: line.quantity } },
      });
      if (update.count !== 1) throw new Error("Stock changed while preparing the delivery order");
    }

    await tx.deliveryOrder.update({
      where: { id },
      data: { status: "READY", pickedAt: null, packedAt: null },
    });
    return { ready: true } as const;
  });

  if ("error" in result && result.error) return { error: result.error };
  revalidateDeliveryPaths(id);
  return result.waiting
    ? { success: "Waiting for sufficient stock" }
    : { success: "Delivery Order is ready to pick" };
}

export async function markDeliveryOrderPickedAction(id: string): Promise<ActionState> {
  await requireAuth();
  const updated = await prisma.deliveryOrder.updateMany({
    where: { id, status: "READY", pickedAt: null },
    data: { pickedAt: new Date() },
  });
  if (updated.count !== 1) return { error: "Only a Ready, unpicked order can be marked picked" };
  revalidateDeliveryPaths(id);
  return { success: "Items marked picked" };
}

export async function markDeliveryOrderPackedAction(id: string): Promise<ActionState> {
  await requireAuth();
  const updated = await prisma.deliveryOrder.updateMany({
    where: { id, status: "READY", pickedAt: { not: null }, packedAt: null },
    data: { packedAt: new Date() },
  });
  if (updated.count !== 1) return { error: "Pick the items before marking them packed" };
  revalidateDeliveryPaths(id);
  return { success: "Items marked packed" };
}

export async function validateDeliveryOrderAction(id: string): Promise<ActionState> {
  await requireAuth();

  await prisma.$transaction(async (tx) => {
    const order = await tx.deliveryOrder.findUnique({
      where: { id },
      select: {
        status: true,
        pickedAt: true,
        packedAt: true,
        fromLocationId: true,
        lines: { select: { productId: true, quantity: true } },
      },
    });
    if (!order) throw new Error("Delivery Order not found");
    if (order.status !== "READY" || !order.pickedAt || !order.packedAt) {
      throw new Error("Pick and pack the order before validating it");
    }
    if (order.lines.length === 0) throw new Error("Delivery Order has no product lines");

    const demand = aggregateDemand(order.lines.map((line) => ({
      productId: line.productId,
      quantity: Number(line.quantity),
    })));

    for (const line of demand) {
      const update = await tx.stock.updateMany({
        where: {
          productId: line.productId,
          locationId: order.fromLocationId,
          onHand: { gte: line.quantity },
          reserved: { gte: line.quantity },
        },
        data: {
          onHand: { decrement: line.quantity },
          reserved: { decrement: line.quantity },
        },
      });
      if (update.count !== 1) throw new Error("Reserved stock changed; delivery was not completed");
    }

    await tx.deliveryOrder.update({ where: { id }, data: { status: "DONE" } });

    for (const line of order.lines) {
      await tx.stockMovement.create({
        data: {
          movementType: "DELIVERY",
          sourceType: "DELIVERY",
          productId: line.productId,
          fromLocationId: order.fromLocationId,
          quantity: line.quantity,
          deliveryOrderId: id,
        },
      });
    }
  });

  revalidateDeliveryPaths(id);
  return { success: "Delivery Order validated — stock updated" };
}

export async function cancelDeliveryOrderAction(id: string): Promise<ActionState> {
  await requireAuth();

  await prisma.$transaction(async (tx) => {
    const order = await tx.deliveryOrder.findUnique({
      where: { id },
      select: {
        status: true,
        fromLocationId: true,
        lines: { select: { productId: true, quantity: true } },
      },
    });
    if (!order) throw new Error("Delivery Order not found");
    if (order.status === "DONE") throw new Error("Cannot cancel a completed Delivery Order");
    if (order.status === "CANCELED") throw new Error("Delivery Order is already canceled");

    if (order.status === "READY") {
      const demand = aggregateDemand(order.lines.map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
      })));
      for (const line of demand) {
        const update = await tx.stock.updateMany({
          where: {
            productId: line.productId,
            locationId: order.fromLocationId,
            reserved: { gte: line.quantity },
          },
          data: { reserved: { decrement: line.quantity } },
        });
        if (update.count !== 1) throw new Error("Reserved stock changed; order could not be canceled");
      }
    }

    await tx.deliveryOrder.update({ where: { id }, data: { status: "CANCELED" } });
  });

  revalidateDeliveryPaths(id);
  return { success: "Delivery Order canceled" };
}