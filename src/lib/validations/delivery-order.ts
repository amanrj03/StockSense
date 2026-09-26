import { z } from "zod";

export const deliveryOrderLineSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce
    .number()
    .positive("Quantity must be greater than 0")
    .max(999999999.999, "Quantity is too large"),
});

export const deliveryOrderSchema = z.object({
  fromLocationId: z.string().min(1, "Source location is required"),
  contact: z.string().trim().min(1, "Contact is required").max(200),
  deliveryAddress: z.string().trim().max(500).optional(),
  operationType: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.enum(["STANDARD_SHIPMENT", "RETURN"]).optional()
  ),
  scheduleDate: z.string().min(1, "Schedule date is required"),
  lines: z.array(deliveryOrderLineSchema).min(1, "At least one product line is required"),
});

export type DeliveryOrderInput = z.infer<typeof deliveryOrderSchema>;