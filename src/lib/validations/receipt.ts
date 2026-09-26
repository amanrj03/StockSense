import { z } from "zod";

export const receiptLineSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
});

export const receiptSchema = z.object({
  toLocationId: z.string().min(1, "Destination location is required"),
  contact: z.string().min(1, "Contact / vendor is required").max(200),
  scheduleDate: z.string().min(1, "Schedule date is required"),
  lines: z.array(receiptLineSchema).min(1, "At least one product line is required"),
});

export type ReceiptInput = z.infer<typeof receiptSchema>;
