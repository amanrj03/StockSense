import { z } from "zod";

export const internalTransferLineSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce
    .number()
    .positive("Quantity must be greater than 0")
    .max(999999999.999, "Quantity is too large")
    .multipleOf(0.001, "Quantity supports at most three decimal places"),
});

export const internalTransferSchema = z.object({
  sourceLocationId: z.string().min(1, "Source location is required"),
  destinationLocationId: z.string().min(1, "Destination location is required"),
  scheduleDate: z.iso.date(),
  lines: z.array(internalTransferLineSchema).min(1, "At least one product line is required"),
});

export type InternalTransferInput = z.infer<typeof internalTransferSchema>;