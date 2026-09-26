import "dotenv/config";
import { hashSync } from "bcryptjs";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the development database");
}

const hostname = new URL(connectionString).hostname.toLowerCase();
const adapter = hostname.endsWith(".neon.tech") ? new PrismaNeon({ connectionString }) : new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const decimal = (value: number) => new Prisma.Decimal(value);

async function ensureUser(login: string, email: string, passwordHash: string) {
  return prisma.user.upsert({
    where: { loginId: login },
    update: { passwordHash },
    create: { loginId: login, email, passwordHash },
  });
}

async function main() {
  const [warehouseCount, locationCount, productCount] = await Promise.all([
    prisma.warehouse.count(),
    prisma.location.count(),
    prisma.product.count(),
  ]);

  if (warehouseCount > 0 || locationCount > 0 || productCount > 0) {
    console.log(`Seed skipped: database already contains ${warehouseCount} warehouses, ${locationCount} locations, and ${productCount} products.`);
    return;
  }

  const admin = await ensureUser("admin01", "admin@stocksense.test", hashSync("Lemon123!", 10));

  const whMain = await prisma.warehouse.create({
    data: { name: "Main Warehouse", shortCode: "WH1", address: "14 Harbor Ln" },
  });
  const whEast = await prisma.warehouse.create({
    data: { name: "East Distribution", shortCode: "WH2", address: "215 East St" },
  });

  const [receiving, picking, cold, returns] = await Promise.all([
    prisma.location.create({ data: { name: "Receiving Dock", shortCode: "RCV", warehouseId: whMain.id } }),
    prisma.location.create({ data: { name: "Picking Aisle", shortCode: "PICK", warehouseId: whMain.id } }),
    prisma.location.create({ data: { name: "Cold Storage", shortCode: "COLD", warehouseId: whEast.id } }),
    prisma.location.create({ data: { name: "Returns Bay", shortCode: "RET", warehouseId: whEast.id } }),
  ]);

  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: "Beverages" }, update: {}, create: { name: "Beverages" } }),
    prisma.category.upsert({ where: { name: "Electronics" }, update: {}, create: { name: "Electronics" } }),
    prisma.category.upsert({ where: { name: "Office" }, update: {}, create: { name: "Office" } }),
    prisma.category.upsert({ where: { name: "Packaging" }, update: {}, create: { name: "Packaging" } }),
  ]);

  const products = await Promise.all([
    prisma.product.create({
      data: { name: "Classic Cola 12oz", sku: "SKU-1001", categoryId: categories[0].id, unitOfMeasure: "pcs", perUnitCost: decimal(1.75), reorderLevel: 30, reorderQty: 120 },
    }),
    prisma.product.create({
      data: { name: "Energy Drink Can", sku: "SKU-1002", categoryId: categories[0].id, unitOfMeasure: "pcs", perUnitCost: decimal(2.4), reorderLevel: 40, reorderQty: 150 },
    }),
    prisma.product.create({
      data: { name: "USB-C Hub", sku: "SKU-2001", categoryId: categories[1].id, unitOfMeasure: "pcs", perUnitCost: decimal(18.5), reorderLevel: 12, reorderQty: 50 },
    }),
    prisma.product.create({
      data: { name: "Wireless Mouse", sku: "SKU-2002", categoryId: categories[1].id, unitOfMeasure: "pcs", perUnitCost: decimal(14.25), reorderLevel: 18, reorderQty: 60 },
    }),
    prisma.product.create({
      data: { name: "A4 Copy Paper", sku: "SKU-3001", categoryId: categories[2].id, unitOfMeasure: "pcs", perUnitCost: decimal(6.2), reorderLevel: 50, reorderQty: 200 },
    }),
    prisma.product.create({
      data: { name: "Packaging Tape", sku: "SKU-4001", categoryId: categories[3].id, unitOfMeasure: "pcs", perUnitCost: decimal(3.75), reorderLevel: 25, reorderQty: 80 },
    }),
  ]);

  await Promise.all([
    prisma.stock.create({ data: { productId: products[0].id, locationId: receiving.id, onHand: decimal(90), reserved: decimal(8) } }),
    prisma.stock.create({ data: { productId: products[1].id, locationId: receiving.id, onHand: decimal(70), reserved: decimal(10) } }),
    prisma.stock.create({ data: { productId: products[2].id, locationId: receiving.id, onHand: decimal(26), reserved: decimal(4) } }),
    prisma.stock.create({ data: { productId: products[3].id, locationId: receiving.id, onHand: decimal(42), reserved: decimal(9) } }),
    prisma.stock.create({ data: { productId: products[4].id, locationId: receiving.id, onHand: decimal(55), reserved: decimal(5) } }),
    prisma.stock.create({ data: { productId: products[5].id, locationId: receiving.id, onHand: decimal(15), reserved: decimal(2) } }),
    prisma.stock.create({ data: { productId: products[0].id, locationId: picking.id, onHand: decimal(55), reserved: decimal(5) } }),
    prisma.stock.create({ data: { productId: products[1].id, locationId: picking.id, onHand: decimal(48), reserved: decimal(6) } }),
    prisma.stock.create({ data: { productId: products[2].id, locationId: picking.id, onHand: decimal(20), reserved: decimal(0) } }),
    prisma.stock.create({ data: { productId: products[3].id, locationId: picking.id, onHand: decimal(30), reserved: decimal(3) } }),
    prisma.stock.create({ data: { productId: products[4].id, locationId: picking.id, onHand: decimal(36), reserved: decimal(6) } }),
    prisma.stock.create({ data: { productId: products[0].id, locationId: cold.id, onHand: decimal(18), reserved: decimal(0) } }),
    prisma.stock.create({ data: { productId: products[2].id, locationId: cold.id, onHand: decimal(12), reserved: decimal(0) } }),
    prisma.stock.create({ data: { productId: products[5].id, locationId: returns.id, onHand: decimal(14), reserved: decimal(0) } }),
  ]);

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const receiptOne = await prisma.receipt.create({
    data: {
      reference: "WH1/IN/0001",
      toLocationId: receiving.id,
      contact: "Northwind Foods",
      scheduleDate: daysAgo(1),
      responsibleId: admin.id,
      status: "DONE",
      lines: { create: [{ productId: products[0].id, quantity: decimal(80) }, { productId: products[1].id, quantity: decimal(60) }] },
    },
  });

  const receiptTwo = await prisma.receipt.create({
    data: {
      reference: "WH1/IN/0002",
      toLocationId: receiving.id,
      contact: "Apex Tech",
      scheduleDate: daysAgo(3),
      responsibleId: admin.id,
      status: "READY",
      lines: { create: [{ productId: products[2].id, quantity: decimal(20) }, { productId: products[3].id, quantity: decimal(18) }] },
    },
  });

  await prisma.stockMovement.createMany({
    data: [
      { movementType: "RECEIPT", sourceType: "RECEIPT", productId: products[0].id, toLocationId: receiving.id, quantity: decimal(80), receiptId: receiptOne.id },
      { movementType: "RECEIPT", sourceType: "RECEIPT", productId: products[1].id, toLocationId: receiving.id, quantity: decimal(60), receiptId: receiptOne.id },
      { movementType: "RECEIPT", sourceType: "RECEIPT", productId: products[2].id, toLocationId: receiving.id, quantity: decimal(20), receiptId: receiptTwo.id },
      { movementType: "RECEIPT", sourceType: "RECEIPT", productId: products[3].id, toLocationId: receiving.id, quantity: decimal(18), receiptId: receiptTwo.id },
    ],
  });

  const deliveryOne = await prisma.deliveryOrder.create({
    data: {
      reference: "WH1/OUT/0001",
      fromLocationId: picking.id,
      contact: "Northwind Foods",
      deliveryAddress: "22 Market St",
      operationType: "Retail",
      scheduleDate: daysAgo(2),
      responsibleId: admin.id,
      status: "READY",
      pickedAt: daysAgo(1),
      packedAt: daysAgo(1),
      lines: { create: [{ productId: products[0].id, quantity: decimal(10) }, { productId: products[1].id, quantity: decimal(12) }] },
    },
  });

  const transferOne = await prisma.internalTransfer.create({
    data: {
      reference: "WH1/INT/0001",
      sourceLocationId: receiving.id,
      destinationLocationId: picking.id,
      scheduleDate: daysAgo(4),
      responsibleId: admin.id,
      status: "DONE",
      lines: { create: [{ productId: products[4].id, quantity: decimal(15) }] },
    },
  });

  const adjustmentOne = await prisma.stockAdjustment.create({
    data: {
      reference: "WH1/ADJ/0001",
      locationId: receiving.id,
      productId: products[5].id,
      systemQuantity: decimal(15),
      physicalQuantity: decimal(12),
      difference: decimal(-3),
      reason: "DAMAGED",
      responsibleId: admin.id,
      status: "DONE",
    },
  });

  await prisma.stockMovement.createMany({
    data: [
      { movementType: "DELIVERY", sourceType: "DELIVERY", productId: products[0].id, fromLocationId: picking.id, quantity: decimal(10), deliveryOrderId: deliveryOne.id },
      { movementType: "DELIVERY", sourceType: "DELIVERY", productId: products[1].id, fromLocationId: picking.id, quantity: decimal(12), deliveryOrderId: deliveryOne.id },
      { movementType: "TRANSFER_OUT", sourceType: "TRANSFER", productId: products[4].id, fromLocationId: receiving.id, quantity: decimal(15), transferId: transferOne.id },
      { movementType: "TRANSFER_IN", sourceType: "TRANSFER", productId: products[4].id, toLocationId: picking.id, quantity: decimal(15), transferId: transferOne.id },
      { movementType: "ADJUSTMENT", sourceType: "ADJUSTMENT", productId: products[5].id, fromLocationId: receiving.id, quantity: decimal(3), adjustmentId: adjustmentOne.id },
    ],
  });

  console.log(`Seed complete: created demo warehouse data, ${products.length} products, and operational history for local development.`);
}

main()
  .catch((error) => {
    console.error("Seed failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
