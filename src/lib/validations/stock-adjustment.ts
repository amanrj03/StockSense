import { z } from "zod";

export const stockAdjustmentSchema = z.object({
  locationId: z.string().min(1, "Location is required"),
  productId: z.string().min(1, "Product is required"),
  physicalQuantity: z.coerce
    .number()
    .min(0, "Physical quantity cannot be negative")
    .max(999999999.999, "Physical quantity is too large"),
  reason: z.enum(["DAMAGED", "LOST", "MISCOUNT", "OTHER"]),
  reasonNote: z.string().trim().max(500).optional(),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;