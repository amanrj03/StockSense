import { z } from "zod";

export const receiptLineSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce
    .number()
    .positive("Quantity must be greater than 0")
    .max(999999999.999, "Quantity is too large")
    .multipleOf(0.001, "Quantity supports at most three decimal places"),
});

export const receiptSchema = z.object({
  toLocationId: z.string().min(1, "Destination location is required"),
  contact: z.string().trim().min(1, "Contact / vendor is required").max(200),
  scheduleDate: z.iso.date(),
  lines: z.array(receiptLineSchema).min(1, "At least one product line is required"),
});

export type ReceiptInput = z.infer<typeof receiptSchema>;
