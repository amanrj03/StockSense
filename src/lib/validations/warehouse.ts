import { z } from "zod";

export const warehouseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  shortCode: z
    .string()
    .min(1, "Short code is required")
    .max(10, "Short code must be 10 characters or less")
    .regex(/^[A-Z0-9_-]+$/, "Short code must be uppercase letters, numbers, hyphens, or underscores"),
  address: z.string().trim().max(255).optional(),
});

export const locationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  shortCode: z
    .string()
    .min(1, "Short code is required")
    .max(20, "Short code must be 20 characters or less")
    .regex(/^[A-Z0-9_-]+$/, "Short code must be uppercase letters, numbers, hyphens, or underscores"),
  warehouseId: z.string().min(1, "Warehouse is required"),
});

export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
