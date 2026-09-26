import "dotenv/config";
import { hashSync } from "bcryptjs";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed the development database");
const hostname = new URL(connectionString).hostname.toLowerCase();
const adapter = hostname.endsWith(".neon.tech") ? new PrismaNeon({ connectionString }) : new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const decimal = (value: number) => new Prisma.Decimal(value.toFixed(3));
const random = (seed: number) => { let value = seed >>> 0; return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; }; };
const choose = <T>(items: T[], next: () => number) => items[Math.floor(next() * items.length) % items.length];
const dateAt = (daysFromToday: number, hour = 10) => { const date = new Date(); date.setHours(hour, 0, 0, 0); date.setDate(date.getDate() + daysFromToday); return date; };

const warehouseSpecs = [
  ["Central Distribution Warehouse", "CDW", "18 Meridian Industrial Park, Pune"], ["North Regional Warehouse", "NRW", "42 Ring Road Logistics Estate, Delhi"],
  ["South Regional Warehouse", "SRW", "7 Port Access Road, Chennai"], ["Raw Materials Warehouse", "RMW", "91 Foundry Lane, Ahmedabad"],
  ["Finished Goods Warehouse", "FGW", "26 Export Boulevard, Mumbai"], ["Spare Parts Warehouse", "SPW", "11 Engineering Drive, Bengaluru"],
  ["West Service Warehouse", "WSW", "63 Freight Corridor, Surat"], ["East Service Warehouse", "ESW", "8 Riverfront Logistics Hub, Kolkata"],
] as const;
const categoryNames = ["Raw Materials", "Electrical Components", "Mechanical Components", "Fasteners", "Tools", "Safety Equipment", "Packaging Materials", "Consumables", "Office Supplies", "Finished Goods", "Spare Parts", "Industrial Components", "Maintenance Supplies", "Process Chemicals", "Pneumatics", "Hydraulics", "Welding Supplies", "Cables and Wiring"];
const families = [
  ["RM", "SS", "Stainless Steel", "kg", 145, 580, ["304 2mm Sheet", "316 1.5mm Sheet", "304 Round Bar 25mm", "316 Flat Bar 40mm", "304 Coil 1mm"]],
  ["RM", "MS", "Mild Steel", "kg", 72, 280, ["Angle 40x40x5mm", "Channel 75mm", "Plate 6mm", "Round Bar 20mm", "Square Tube 50mm"]],
  ["EL", "CBL", "Copper Cable", "meter", 38, 160, ["4 sq mm PVC", "6 sq mm XLPE", "1.5 sq mm Control", "16 sq mm Armoured", "10 sq mm Earth"]],
  ["EL", "SW", "Industrial Selector Switch", "pcs", 210, 740, ["Emergency Stop", "3 Position", "Limit Roller", "Push Button Green", "Push Button Red"]],
  ["ME", "BRG", "Industrial Bearing", "pcs", 280, 1600, ["6205 2RS", "6306 ZZ", "6204 C3", "22210 Spherical", "6208 Deep Groove"]],
  ["ME", "HOS", "Hydraulic Hose", "meter", 180, 950, ["1/2 inch SAE", "3/4 inch Return", "1 inch High Pressure", "3/8 inch Control", "1/4 inch Test"]],
  ["SF", "BLT", "Hex Bolt", "pcs", 3, 28, ["M10 x 50mm", "M12 x 75mm", "M8 x 30mm", "M16 x 90mm", "M6 x 25mm"]],
  ["SF", "NUT", "Nyloc Nut", "pcs", 2, 18, ["M10 Zinc", "M12 Stainless", "M8 Flange", "M16 Heavy Hex", "M6 Nyloc"]],
  ["TL", "DRL", "HSS Twist Drill", "set", 420, 2400, ["3-12mm Set", "5-20mm Cobalt", "Countersink Set", "Masonry Set", "Step Drill Set"]],
  ["TL", "WRE", "Combination Wrench", "set", 680, 3200, ["8 Piece Metric", "12 Piece Metric", "Adjustable 300mm", "Torque 1/2 inch", "Pipe Wrench 450mm"]],
  ["SE", "GLV", "Nitrile Industrial Gloves", "pair", 28, 140, ["Textured Palm", "Chemical Resistant", "Cut Level 5", "Heat Resistant", "Oil Grip"]],
  ["SE", "HLM", "Safety Helmet", "pcs", 240, 820, ["Yellow Vented", "White Ratchet", "Blue Non-Vented", "Red Chin Strap", "Orange Reflective"]],
  ["PK", "BOX", "Corrugated Shipping Box", "pcs", 24, 190, ["12x10x8", "18x14x12", "24x18x16", "30x20x20", "10x8x6"]],
  ["PK", "TAP", "Packaging Tape", "roll", 72, 320, ["48mm Clear", "48mm Brown", "72mm Reinforced", "24mm Masking", "48mm Printed"]],
  ["CO", "LUB", "Industrial Lubricant", "litre", 380, 2100, ["Hydraulic ISO 46", "Gear Oil 220", "Multi-Purpose Grease", "Compressor Oil", "Cutting Fluid"]],
  ["OS", "PAP", "A4 Copy Paper", "box", 290, 820, ["80 GSM", "100 GSM", "A3 80 GSM", "Recycled 75 GSM", "Colour Mixed"]],
  ["FG", "MTR", "Panel Mount Motor", "pcs", 8600, 32500, ["1.5kW IE3", "3kW Brake", "5.5kW Foot Mount", "7.5kW Flange", "11kW High Efficiency"]],
  ["SP", "FLT", "Replacement Air Filter", "pcs", 190, 1450, ["Panel 300mm", "Hydraulic Return", "Oil Spin-On", "Dust Collector", "Cabin Air"]],
] as const;

type LocationRow = { id: string; warehouseId: string; shortCode: string; name: string };
type ProductRow = { id: string; sku: string; name: string; unitOfMeasure: string };
type StockState = { onHand: number; reserved: number };

async function main() {
  const [receiptCount, deliveryCount, transferCount, adjustmentCount] = await Promise.all([
    prisma.receipt.count({ where: { reference: { contains: "/IN/" } } }),
    prisma.deliveryOrder.count({ where: { reference: { contains: "/OUT/" } } }),
    prisma.internalTransfer.count({ where: { reference: { contains: "/INT/" } } }),
    prisma.stockAdjustment.count({ where: { reference: { contains: "/ADJ/" } } }),
  ]);
  const receiptMarker = receiptCount >= 180;
  const deliveryMarker = deliveryCount >= 180;
  const transferMarker = transferCount >= 120;
  const adjustmentMarker = adjustmentCount >= 90;
  const profileBaseMarker = await prisma.stockAdjustment.findUnique({ where: { reference: "CDW/ADJ/0100" }, select: { id: true } });
  const profileMarker = await prisma.stockAdjustment.findUnique({ where: { reference: "CDW/ADJ/0200" }, select: { id: true } });
  if (receiptMarker && deliveryMarker && transferMarker && adjustmentMarker && profileMarker) { console.log("Seed skipped: the large Lemon development dataset is already present."); return; }

  const next = random(20260926);
  const passwordHash = hashSync("Lemon123!", 10);
  const firstNames = ["Aarav", "Mira", "Kabir", "Anaya", "Rohan", "Ishita", "Vihaan", "Nisha", "Arjun", "Tara", "Dev", "Meera", "Neil", "Kavya"];
  const lastNames = ["Shah", "Iyer", "Kapoor", "Menon", "Desai", "Bose", "Rao"];
  const users = await Promise.all(firstNames.map((first, index) => prisma.user.upsert({
    where: { loginId: `demo${String(index + 1).padStart(2, "0")}` }, update: { passwordHash },
    create: { loginId: `demo${String(index + 1).padStart(2, "0")}`, email: `${first.toLowerCase()}.${lastNames[index % lastNames.length].toLowerCase()}@lemon-industrial.test`, passwordHash },
  })));
  const admin = await prisma.user.upsert({ where: { loginId: "admin01" }, update: { passwordHash }, create: { loginId: "admin01", email: "admin@stocksense.test", passwordHash } });
  users.push(admin);
  const categories = await Promise.all(categoryNames.map((name) => prisma.category.upsert({ where: { name }, update: {}, create: { name } })));
  const warehouses = await Promise.all(warehouseSpecs.map(([name, shortCode, address]) => prisma.warehouse.upsert({ where: { shortCode }, update: { name, address }, create: { name, shortCode, address } })));
  const locations: LocationRow[] = [];
  for (const warehouse of warehouses) for (let aisle = 1; aisle <= 8; aisle += 1) for (let bay = 1; bay <= 8; bay += 1) {
    const shortCode = `A${aisle}-${String(bay).padStart(2, "0")}`;
    locations.push(await prisma.location.upsert({ where: { shortCode_warehouseId: { shortCode, warehouseId: warehouse.id } }, update: { name: `${warehouse.shortCode} Aisle ${aisle}, Bay ${bay}` }, create: { shortCode, name: `${warehouse.shortCode} Aisle ${aisle}, Bay ${bay}`, warehouseId: warehouse.id } }));
  }

  const products: ProductRow[] = [];
  for (let index = 0; index < 320; index += 1) {
    const family = families[index % families.length];
    const [prefix, code, baseName, unitOfMeasure, minCost, maxCost, variants] = family;
    const sku = `${prefix}-${code}-${String(index + 1).padStart(3, "0")}`;
    products.push(await prisma.product.upsert({ where: { sku }, update: {}, create: { sku, name: `${baseName} ${variants[Math.floor(index / families.length) % variants.length]}`, categoryId: categories[index % categories.length].id, unitOfMeasure, perUnitCost: decimal(minCost + next() * (maxCost - minCost)), reorderLevel: 8 + (index % 8) * 4, reorderQty: 40 + (index % 6) * 20 } }));
  }

  const stock = new Map<string, StockState>();
  const stockRows: { productId: string; locationId: string; onHand: number; reserved: number }[] = [];
  for (let index = 0; index < 1100; index += 1) {
    const product = products[index % products.length];
    const location = locations[(index * 17) % locations.length];
    const key = `${product.id}:${location.id}`;
    if (stock.has(key)) continue;
    const onHand = index % 31 === 0 ? 0 : index % 13 === 0 ? 3 : 35 + (index % 90);
    stock.set(key, { onHand, reserved: 0 });
    stockRows.push({ productId: product.id, locationId: location.id, onHand, reserved: 0 });
  }
  await prisma.stock.createMany({ data: stockRows, skipDuplicates: true });
  const persistedStock = await prisma.stock.findMany({ where: { productId: { in: products.map((product) => product.id) } }, select: { productId: true, locationId: true, onHand: true, reserved: true } });
  for (const row of persistedStock) stock.set(`${row.productId}:${row.locationId}`, { onHand: Number(row.onHand), reserved: Number(row.reserved) });
  const updateStock = async (productId: string, locationId: string, onHandDelta: number, reservedDelta = 0) => {
    const key = `${productId}:${locationId}`;
    const state = stock.get(key) ?? { onHand: 0, reserved: 0 };
    state.onHand += onHandDelta; state.reserved += reservedDelta; stock.set(key, state);
    await prisma.stock.upsert({ where: { productId_locationId: { productId, locationId } }, update: { onHand: decimal(state.onHand), reserved: decimal(state.reserved) }, create: { productId, locationId, onHand: decimal(state.onHand), reserved: decimal(state.reserved) } });
  };
  const pairList = (minimum = 0) => [...stock.entries()].filter(([, state]) => state.onHand - state.reserved > minimum);
  const locationPairs = (locationId: string, minimum = 0) => pairList(minimum).filter(([key]) => key.endsWith(`:${locationId}`));
  const operationUser = (index: number) => users[index % users.length];
  const reference = (warehouseCode: string, type: string, index: number) => `${warehouseCode}/${type}/${String(index + 1).padStart(4, "0")}`;

  if (!receiptMarker) for (let index = 0; index < 180; index += 1) {
    const location = locations[(index * 11 + 3) % locations.length];
    const warehouse = warehouses.find((item) => item.id === location.warehouseId)!;
    const status = index < 145 ? "DONE" : index < 160 ? "READY" : "DRAFT";
    const lineData = [0, 1, 2].map((line) => ({ productId: products[(index * 13 + line * 29) % products.length].id, quantity: decimal(20 + Math.floor(next() * 90)) }));
    const receipt = await prisma.receipt.create({ data: { reference: reference(warehouse.shortCode, "IN", index), toLocationId: location.id, contact: choose(["Apex Metals", "Vertex Electrical", "Harbor Industrial Supply", "Meridian Components", "BluePeak Manufacturing"], next), scheduleDate: dateAt(-330 + index * 2), createdAt: dateAt(-330 + index * 2, 8), responsibleId: operationUser(index).id, status, lines: { create: lineData } } });
    if (status === "DONE") for (const line of lineData) { const quantity = Number(line.quantity); await updateStock(line.productId, location.id, quantity); await prisma.stockMovement.create({ data: { movementType: "RECEIPT", sourceType: "RECEIPT", productId: line.productId, toLocationId: location.id, quantity: line.quantity, receiptId: receipt.id, createdAt: receipt.createdAt } }); }
  }

  if (!deliveryMarker) for (let index = 0; index < 180; index += 1) {
    const [pairKey] = choose(pairList(25), next); const [, locationId] = pairKey.split(":"); const location = locations.find((item) => item.id === locationId)!; const warehouse = warehouses.find((item) => item.id === location.warehouseId)!;
    const status = index < 125 ? "DONE" : index < 145 ? "READY" : index < 165 ? "WAITING" : "DRAFT";
    const lines = [0, 1, 2].map(() => { const [candidateKey] = choose(locationPairs(locationId, 15), next) ?? [pairKey, { onHand: 0, reserved: 0 }]; const [candidateProduct] = candidateKey.split(":"); return { productId: candidateProduct, quantity: decimal(2 + Math.floor(next() * 7)) }; });
    const order = await prisma.deliveryOrder.create({ data: { reference: reference(warehouse.shortCode, "OUT", index), fromLocationId: location.id, contact: choose(["Orion Fabrication", "Crestline Retail", "Nova Engineering", "Axis Automation", "Summit Projects"], next), deliveryAddress: choose(["12 Market Street, Pune", "88 Industrial Estate, Nashik", "4 Export Road, Mumbai", "31 Ring Road, Bengaluru"], next), operationType: choose(["Production replenishment", "Customer dispatch", "Service order", "Project allocation"], next), scheduleDate: dateAt(-320 + index * 2), createdAt: dateAt(-320 + index * 2, 11), responsibleId: operationUser(index + 2).id, status, pickedAt: status === "DONE" || status === "READY" ? dateAt(-318 + index * 2, 13) : null, packedAt: status === "DONE" || status === "READY" ? dateAt(-317 + index * 2, 15) : null, lines: { create: lines } } });
    if (status === "DONE" || status === "READY") for (const line of lines) { const quantity = Number(line.quantity); await updateStock(line.productId, location.id, status === "DONE" ? -quantity : 0, status === "READY" ? quantity : 0); if (status === "DONE") await prisma.stockMovement.create({ data: { movementType: "DELIVERY", sourceType: "DELIVERY", productId: line.productId, fromLocationId: location.id, quantity: line.quantity, deliveryOrderId: order.id, createdAt: order.createdAt } }); }
  }

  if (!transferMarker) for (let index = 0; index < 120; index += 1) {
    const [pair] = choose(pairList(25), next); const [productId, sourceId] = pair.split(":"); const source = locations.find((item) => item.id === sourceId)!; const destination = locations[(locations.indexOf(source) + 1 + index % 7) % locations.length]; const quantity = Math.min(6 + index % 12, Math.floor(stock.get(pair)!.onHand - stock.get(pair)!.reserved)); const warehouse = warehouses.find((item) => item.id === source.warehouseId)!; const status = index < 90 ? "DONE" : index < 105 ? "READY" : "DRAFT";
    const secondPair = choose(locationPairs(source.id, 25).filter(([key]) => key !== pair), next)?.[0] ?? pair; const secondProductId = secondPair.split(":")[0]; const secondQuantity = Math.min(Math.max(1, quantity - 2), Math.floor(stock.get(secondPair)!.onHand - stock.get(secondPair)!.reserved));
    const lines = [{ productId, quantity }, { productId: secondProductId, quantity: secondQuantity }];
    const transfer = await prisma.internalTransfer.create({ data: { reference: reference(warehouse.shortCode, "INT", index), sourceLocationId: source.id, destinationLocationId: destination.id, scheduleDate: dateAt(-290 + index * 2), createdAt: dateAt(-290 + index * 2, 9), responsibleId: operationUser(index + 4).id, status, lines: { create: lines.map((line) => ({ productId: line.productId, quantity: decimal(line.quantity) })) } } });
    if (status === "DONE") for (const line of lines) { await updateStock(line.productId, source.id, -line.quantity); await updateStock(line.productId, destination.id, line.quantity); await prisma.stockMovement.createMany({ data: [{ movementType: "TRANSFER_OUT", sourceType: "TRANSFER", productId: line.productId, fromLocationId: source.id, quantity: decimal(line.quantity), transferId: transfer.id, createdAt: transfer.createdAt }, { movementType: "TRANSFER_IN", sourceType: "TRANSFER", productId: line.productId, toLocationId: destination.id, quantity: decimal(line.quantity), transferId: transfer.id, createdAt: transfer.createdAt }] }); }
  }

  if (!adjustmentMarker) for (let index = 0; index < 90; index += 1) {
    const pair = choose([...stock.entries()], next); const [productId, locationId] = pair[0].split(":"); const state = pair[1]; const location = locations.find((item) => item.id === locationId)!; const warehouse = warehouses.find((item) => item.id === location.warehouseId)!; const status = index < 70 ? "DONE" : "DRAFT"; const negative = index % 3 !== 0; const difference = negative ? -Math.min(5, Math.floor(state.onHand - state.reserved)) : 2 + index % 7; const systemQuantity = state.onHand; const physicalQuantity = systemQuantity + difference;
    const adjustment = await prisma.stockAdjustment.create({ data: { reference: reference(warehouse.shortCode, "ADJ", index), locationId, productId, systemQuantity: decimal(systemQuantity), physicalQuantity: decimal(physicalQuantity), difference: decimal(difference), reason: negative ? (index % 2 === 0 ? "DAMAGED" : "LOST") : (index % 2 === 0 ? "MISCOUNT" : "OTHER"), reasonNote: index % 2 === 0 ? null : "Cycle count variance confirmed by warehouse lead", responsibleId: operationUser(index + 7).id, status, createdAt: dateAt(-250 + index * 2, 14) } });
    if (status === "DONE" && difference !== 0) { await updateStock(productId, locationId, difference); await prisma.stockMovement.create({ data: { movementType: "ADJUSTMENT", sourceType: "ADJUSTMENT", productId, fromLocationId: difference < 0 ? locationId : null, toLocationId: difference > 0 ? locationId : null, quantity: decimal(Math.abs(difference)), adjustmentId: adjustment.id, createdAt: adjustment.createdAt } }); }
  }

  if (!profileBaseMarker) {
    for (let index = 0; index < 24; index += 1) {
      const product = products[(index * 13 + 7) % products.length];
      const candidate = [...stock.entries()].find(([key, state]) => key.startsWith(`${product.id}:`) && state.reserved === 0 && state.onHand > 10);
      if (!candidate) continue;
      const [key, state] = candidate;
      const [, locationId] = key.split(":");
      const target = index < 10 ? 0 : 2 + (index % 4);
      const difference = target - state.onHand;
      if (difference === 0) continue;
      const adjustment = await prisma.stockAdjustment.create({ data: { reference: reference(warehouses[0].shortCode, "ADJ", 99 + index), locationId, productId: product.id, systemQuantity: decimal(state.onHand), physicalQuantity: decimal(target), difference: decimal(difference), reason: target === 0 ? "DAMAGED" : "MISCOUNT", responsibleId: operationUser(index + 10).id, status: "DONE", createdAt: dateAt(-20 + index) } });
      await updateStock(product.id, locationId, difference);
      await prisma.stockMovement.create({ data: { movementType: "ADJUSTMENT", sourceType: "ADJUSTMENT", productId: product.id, fromLocationId: difference < 0 ? locationId : null, toLocationId: difference > 0 ? locationId : null, quantity: decimal(Math.abs(difference)), adjustmentId: adjustment.id, createdAt: adjustment.createdAt } });
    }

  }

  if (!profileMarker) {
    let profileIndex = 0;
    for (let productIndex = 0; productIndex < 18; productIndex += 1) {
      const product = products[(productIndex * 17 + 11) % products.length];
      const target = productIndex < 8 ? 0 : 3;
      const entries = [...stock.entries()].filter(([key, state]) => key.startsWith(`${product.id}:`) && state.reserved === 0 && state.onHand > target);
      for (const [key, state] of entries) {
        const [, locationId] = key.split(":");
        const difference = target - state.onHand;
        const adjustment = await prisma.stockAdjustment.create({ data: { reference: reference(warehouses[0].shortCode, "ADJ", 199 + profileIndex), locationId, productId: product.id, systemQuantity: decimal(state.onHand), physicalQuantity: decimal(target), difference: decimal(difference), reason: target === 0 ? "DAMAGED" : "MISCOUNT", responsibleId: operationUser(profileIndex + 12).id, status: "DONE", createdAt: dateAt(-12 + profileIndex % 12) } });
        await updateStock(product.id, locationId, difference);
        await prisma.stockMovement.create({ data: { movementType: "ADJUSTMENT", sourceType: "ADJUSTMENT", productId: product.id, fromLocationId: difference < 0 ? locationId : null, toLocationId: difference > 0 ? locationId : null, quantity: decimal(Math.abs(difference)), adjustmentId: adjustment.id, createdAt: adjustment.createdAt } });
        profileIndex += 1;
      }
    }
  }

  await prisma.internalTransfer.updateMany({ where: { reference: { startsWith: "CDW/INT/" }, status: "READY" }, data: { scheduleDate: dateAt(3) } });

  console.log("Seed complete: 8 warehouses, 64 locations, 18 categories, 320 products, 1100 stock records, 180 receipts, 180 delivery orders, 120 transfers, 90 adjustments, and a linked movement ledger.");
}

main().catch((error) => { console.error("Seed failed"); console.error(error); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
