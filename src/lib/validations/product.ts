import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, "SKU must be uppercase letters, numbers, hyphens, or underscores"),
  categoryId: z.string().optional(),
  unitOfMeasure: z.string().min(1, "Unit of measure is required").max(20),
  perUnitCost: z.coerce
    .number()
    .min(0, "Cost cannot be negative")
    .default(0),
  reorderLevel: z.coerce.number().int().min(0).optional().nullable(),
  reorderQty: z.coerce.number().int().min(0).optional().nullable(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
