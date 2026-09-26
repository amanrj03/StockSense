import { prisma } from "@/lib/prisma";

export interface MoveHistoryRow {
  id: string;
  reference: string;
  date: Date;
  contact: string;
  from: string;
  to: string;
  quantity: number;
  status: string;
  product: string;
  sku: string;
  direction: "IN" | "OUT";
  movementType: string;
}

function locationLabel(location: { shortCode: string; warehouse: { shortCode: string } } | null) {
  return location ? `${location.warehouse.shortCode}/${location.shortCode}` : "—";
}

export async function getMoveHistory(searchTerm = ""): Promise<MoveHistoryRow[]> {
  const term = searchTerm.trim();
  const contains = (value: string) => ({ contains: value, mode: "insensitive" as const });

  const movements = await prisma.stockMovement.findMany({
    where: term
      ? {
          OR: [
            { receipt: { is: { reference: contains(term) } } },
            { receipt: { is: { contact: contains(term) } } },
            { deliveryOrder: { is: { reference: contains(term) } } },
            { deliveryOrder: { is: { contact: contains(term) } } },
            { transfer: { is: { reference: contains(term) } } },
            { adjustment: { is: { reference: contains(term) } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, sku: true } },
      fromLocation: { include: { warehouse: { select: { shortCode: true } } } },
      toLocation: { include: { warehouse: { select: { shortCode: true } } } },
      receipt: { select: { reference: true, contact: true, status: true } },
      deliveryOrder: { select: { reference: true, contact: true, status: true } },
      transfer: {
        select: {
          reference: true,
          status: true,
          sourceLocation: { include: { warehouse: { select: { shortCode: true } } } },
          destinationLocation: { include: { warehouse: { select: { shortCode: true } } } },
        },
      },
      adjustment: { select: { reference: true, status: true } },
    },
  });

  return movements.map((movement) => {
    const reference = movement.receipt?.reference
      ?? movement.deliveryOrder?.reference
      ?? movement.transfer?.reference
      ?? movement.adjustment?.reference
      ?? "—";
    const status = movement.receipt?.status
      ?? movement.deliveryOrder?.status
      ?? movement.transfer?.status
      ?? movement.adjustment?.status
      ?? "—";
    const contact = movement.receipt?.contact ?? movement.deliveryOrder?.contact ?? "—";
    const source = locationLabel(movement.fromLocation);
    const destination = locationLabel(movement.toLocation);
    const from = movement.movementType === "RECEIPT"
      ? "Vendor"
      : movement.movementType === "TRANSFER_IN"
        ? locationLabel(movement.transfer?.sourceLocation ?? null)
        : source;
    const to = movement.movementType === "DELIVERY"
      ? "Customer"
      : movement.movementType === "TRANSFER_OUT"
        ? locationLabel(movement.transfer?.destinationLocation ?? null)
        : destination;
    const direction = movement.movementType === "RECEIPT" || movement.movementType === "TRANSFER_IN"
      ? "IN"
      : movement.movementType === "ADJUSTMENT" && movement.toLocationId
        ? "IN"
        : "OUT";

    return {
      id: movement.id,
      reference,
      date: movement.createdAt,
      contact,
      from,
      to,
      quantity: Number(movement.quantity),
      status,
      product: movement.product.name,
      sku: movement.product.sku,
      direction,
      movementType: movement.movementType,
    };
  });
}