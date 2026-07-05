import type { ProductFilterParams } from "@/types/dto";

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
  user: {
    all: ["user"] as const,
    profile: () => [...queryKeys.user.all, "profile"] as const,
  },
  products: {
    all: ["products"] as const,
    list: () => [...queryKeys.products.all, "list"] as const,
    filter: (params: ProductFilterParams) =>
      [...queryKeys.products.all, "filter", params] as const,
    detail: (id: string) => [...queryKeys.products.all, "detail", id] as const,
    byName: (name: string) => [...queryKeys.products.all, "name", name] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => [...queryKeys.categories.all, "list"] as const,
    root: () => [...queryKeys.categories.all, "root"] as const,
    detail: (id: string) => [...queryKeys.categories.all, "detail", id] as const,
  },
  brands: {
    all: ["brands"] as const,
    list: () => [...queryKeys.brands.all, "list"] as const,
    featured: () => [...queryKeys.brands.all, "featured"] as const,
  },
  vehicles: {
    all: ["vehicles"] as const,
    list: () => [...queryKeys.vehicles.all, "list"] as const,
    search: (make?: string, model?: string) =>
      [...queryKeys.vehicles.all, "search", make ?? "", model ?? ""] as const,
    detail: (id: string) => [...queryKeys.vehicles.all, "detail", id] as const,
  },
  cart: {
    all: ["cart"] as const,
    current: () => [...queryKeys.cart.all, "current"] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: () => [...queryKeys.orders.all, "list"] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
  },
  addresses: {
    all: ["addresses"] as const,
    list: () => [...queryKeys.addresses.all, "list"] as const,
  },
  admin: {
    all: ["admin"] as const,
    users: () => [...queryKeys.admin.all, "users"] as const,
    orders: () => [...queryKeys.admin.all, "orders"] as const,
  },
} as const;
