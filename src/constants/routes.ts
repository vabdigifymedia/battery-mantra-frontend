export const ROUTES = {
  home: "/",
  products: "/products",
  productDetail: (id: string) => `/products/${id}`,
  vehicleFinder: "/vehicle-finder",
  cart: "/cart",
  checkout: "/checkout",
  orders: "/orders",
  orderDetail: (id: string) => `/orders/${id}`,
  login: "/login",
  register: "/register",
} as const;
