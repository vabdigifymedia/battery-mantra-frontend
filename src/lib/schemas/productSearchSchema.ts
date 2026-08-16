import { z } from "zod";

export const productSearchSchema = z.object({
  q: z.string().optional(),
  categoryId: z.union([z.string(), z.array(z.string())]).optional().transform(v => Array.isArray(v) ? v : v ? [v] : undefined),
  brandId: z.union([z.string(), z.array(z.string())]).optional().transform(v => Array.isArray(v) ? v : v ? [v] : undefined),
  capacity: z.union([z.string(), z.array(z.string())]).optional().transform(v => Array.isArray(v) ? v : v ? [v] : undefined),
  warranty: z.union([z.string(), z.array(z.string())]).optional().transform(v => Array.isArray(v) ? v : v ? [v] : undefined),
  vehicleId: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  size: z.coerce.number().int().min(1).max(60).optional().default(20),
  sort: z.enum(["relevance", "price-asc", "price-desc", "name-asc", "name-desc"]).optional().default("relevance"),
});

export type ProductSearchState = z.infer<typeof productSearchSchema>;
