/**
 * Endpoint registry — paths lifted directly from the Battery Mantra OpenAPI spec.
 * Do not invent paths. Every path here is a real backend route.
 */
export const endpoints = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
  },
  products: {
    list: "/api/products",
    filter: "/api/products/filter",
    byId: (id: string) => `/api/products/id/${encodeURIComponent(id)}`,
    byName: (name: string) => `/api/products/name/${encodeURIComponent(name)}`,
  },
  categories: {
    list: "/api/categories",
    root: "/api/categories/root",
    byId: (id: string) => `/api/categories/id/${encodeURIComponent(id)}`,
    byName: (name: string) => `/api/categories/name/${encodeURIComponent(name)}`,
  },
  brands: {
    list: "/api/brands",
    featured: "/api/brands/featured",
    byId: (id: string) => `/api/brands/${encodeURIComponent(id)}`,
  },
  vehicles: {
    list: "/api/vehicles",
    search: "/api/vehicles/search",
    byId: (id: string) => `/api/vehicles/${encodeURIComponent(id)}`,
  },
  cart: {
    get: "/api/cart",
    add: "/api/cart/add",
    updateItem: (cartItemId: string) =>
      `/api/cart/items/${encodeURIComponent(cartItemId)}`,
    removeItem: (cartItemId: string) =>
      `/api/cart/items/${encodeURIComponent(cartItemId)}`,
    clear: "/api/cart/clear",
  },
  orders: {
    list: "/api/orders",
    byId: (orderId: string) => `/api/orders/${encodeURIComponent(orderId)}`,
    cancel: (orderId: string) => `/api/orders/${encodeURIComponent(orderId)}/cancel`,
    checkout: "/api/orders/checkout",
  },
  addresses: {
    list: "/api/addresses",
    add: "/api/addresses",
    update: (id: string) => `/api/addresses/${encodeURIComponent(id)}`,
    delete: (id: string) => `/api/addresses/${encodeURIComponent(id)}`,
  },
  admin: {
    users: "/api/admin/users",
    orders: "/api/admin/orders",
    updateOrderStatus: (orderId: string) => `/api/admin/orders/${encodeURIComponent(orderId)}/status`,
    products: {
      create: "/api/admin/products",
      update: (id: string) => `/api/admin/products/id/${encodeURIComponent(id)}`,
      delete: (id: string) => `/api/admin/products/id/${encodeURIComponent(id)}`,
    },
    categories: {
      create: "/api/admin/categories",
      update: (id: string) => `/api/admin/categories/id/${encodeURIComponent(id)}`,
      delete: (id: string) => `/api/admin/categories/id/${encodeURIComponent(id)}`,
    },
    brands: {
      create: "/api/admin/brands",
      update: (id: string) => `/api/admin/brands/${encodeURIComponent(id)}`,
      delete: (id: string) => `/api/admin/brands/${encodeURIComponent(id)}`,
    },
    vehicles: {
      create: "/api/admin/vehicles",
      update: (id: string) => `/api/admin/vehicles/${encodeURIComponent(id)}`,
      delete: (id: string) => `/api/admin/vehicles/${encodeURIComponent(id)}`,
    },
  },
} as const;
