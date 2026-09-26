import { describe, expect, it } from "vitest";
import { receiptSchema } from "../src/lib/validations/receipt";
import { deliveryOrderSchema } from "../src/lib/validations/delivery-order";
import { internalTransferSchema } from "../src/lib/validations/internal-transfer";
import { stockAdjustmentSchema } from "../src/lib/validations/stock-adjustment";
import { productSchema } from "../src/lib/validations/product";
import { resetPasswordSchema, signUpSchema } from "../src/lib/validations/auth";

describe("operation input schemas", () => {
  it("accepts a valid receipt and rejects malformed dates and unsupported precision", () => {
    const valid = {
      toLocationId: "location-1",
      contact: "  Supplier  ",
      scheduleDate: "2026-09-26",
      lines: [{ productId: "product-1", quantity: "12.125" }],
    };

    expect(receiptSchema.safeParse(valid).success).toBe(true);
    expect(receiptSchema.safeParse({ ...valid, scheduleDate: "2026-02-30" }).success).toBe(false);
    expect(receiptSchema.safeParse({
      ...valid,
      lines: [{ productId: "product-1", quantity: "1.2345" }],
    }).success).toBe(false);
  });

  it("normalizes and validates Delivery Order contact and schedule fields", () => {
    const valid = {
      fromLocationId: "location-1",
      contact: " Customer ",
      deliveryAddress: " Dock 2 ",
      operationType: "STANDARD_SHIPMENT",
      scheduleDate: "2026-09-26",
      lines: [{ productId: "product-1", quantity: 1.25 }],
    };

    const parsed = deliveryOrderSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.contact).toBe("Customer");
    expect(deliveryOrderSchema.safeParse({ ...valid, contact: "   " }).success).toBe(false);
    expect(deliveryOrderSchema.safeParse({ ...valid, operationType: "UNSPECIFIED" }).success).toBe(false);
  });

  it("allows transfers between distinct locations and validates three-decimal quantities", () => {
    const valid = {
      sourceLocationId: "source",
      destinationLocationId: "destination",
      scheduleDate: "2026-09-26",
      lines: [{ productId: "product-1", quantity: "0.125" }],
    };

    expect(internalTransferSchema.safeParse(valid).success).toBe(true);
    expect(internalTransferSchema.safeParse({
      ...valid,
      lines: [{ productId: "product-1", quantity: "0.0001" }],
    }).success).toBe(false);
  });

  it("permits zero physical stock but rejects negative or over-precision counts", () => {
    const valid = {
      locationId: "location-1",
      productId: "product-1",
      physicalQuantity: "0",
      reason: "MISCOUNT",
    };

    expect(stockAdjustmentSchema.safeParse(valid).success).toBe(true);
    expect(stockAdjustmentSchema.safeParse({ ...valid, physicalQuantity: "-1" }).success).toBe(false);
    expect(stockAdjustmentSchema.safeParse({ ...valid, physicalQuantity: "1.0001" }).success).toBe(false);
  });
});

describe("account input schemas", () => {
  it("normalizes signup emails before unique checks", () => {
    const parsed = signUpSchema.safeParse({
      loginId: "worker01",
      email: "  Worker@Example.com ",
      password: "SecurePass!1",
      confirmPassword: "SecurePass!1",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("worker@example.com");
  });

  it("requires a six-digit OTP and valid email for password reset", () => {
    const valid = {
      email: " USER@example.com ",
      token: "012345",
      password: "SecurePass!2",
      confirmPassword: "SecurePass!2",
    };

    const parsed = resetPasswordSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("user@example.com");
    expect(resetPasswordSchema.safeParse({ ...valid, token: "12345" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...valid, token: "abcdef" }).success).toBe(false);
  });

  it("enforces the PostgreSQL decimal precision of product costs", () => {
    const valid = {
      name: " Desk ",
      sku: "DESK-001",
      unitOfMeasure: "pcs",
      perUnitCost: "25.50",
    };

    expect(productSchema.safeParse(valid).success).toBe(true);
    expect(productSchema.safeParse({ ...valid, perUnitCost: "1.001" }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, perUnitCost: "10000000000" }).success).toBe(false);
  });
});