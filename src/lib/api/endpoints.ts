/**
 * Endpoint registry — paths lifted directly from the Battery Mantra OpenAPI spec.
 * Do not invent paths. Every path here is a real backend route.
 */
export const endpoints = {
  cms: {
    public: "/api/cms/pages",
    admin: "/api/admin/cms/pages",
  },
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    refresh: "/api/auth/refresh",
    sendOtp: "/api/auth/send-otp",
    verifyOtp: "/api/auth/verify-otp",
  },
  user: {
    profile: "/api/user/profile",
    password: "/api/user/password",
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
  banners: {
    active: "/api/banners/active",
  },
  callbacks: {
    create: "/api/callbacks",
  },
  enquiries: {
    quotation: "/api/enquiries/quotation",
    corporate: "/api/enquiries/corporate",
  },
  manufacturers: {
    list: "/api/manufacturers",
  },
  vehicles: {
    list: "/api/vehicles",
    search: "/api/vehicles/search",
    makes: "/api/vehicles/makes",
    capacities: "/api/capacities",
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
    capacities: "/api/admin/capacities",
    fuels: "/api/fuels",
    orders: "/api/admin/orders",
    upload: "/api/admin/upload",
    updateOrderStatus: (orderId: string) => `/api/admin/orders/${encodeURIComponent(orderId)}/status`,
    assignPartner: (orderId: string, partnerId: string) => `/api/admin/orders/${encodeURIComponent(orderId)}/assign-partner?partnerId=${encodeURIComponent(partnerId)}`,
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
    banners: {
      list: "/api/admin/banners",
      create: "/api/admin/banners",
      update: (id: string) => `/api/admin/banners/id/${encodeURIComponent(id)}`,
      delete: (id: string) => `/api/admin/banners/id/${encodeURIComponent(id)}`,
    },
    vehicles: {
      create: "/api/admin/vehicles",
      update: (id: string) => `/api/admin/vehicles/${encodeURIComponent(id)}`,
      delete: (id: string) => `/api/admin/vehicles/${encodeURIComponent(id)}`,
    },
    manufacturers: {
      create: "/api/manufacturers",
      update: (id: string) => `/api/manufacturers/${encodeURIComponent(id)}`,
      delete: (id: string) => `/api/manufacturers/${encodeURIComponent(id)}`,
    },
    callbacks: {
      list: "/api/admin/callbacks",
      updateStatus: (id: string) => `/api/admin/callbacks/${encodeURIComponent(id)}/status`,
    },
    enquiries: {
      list: (type?: string) => type ? `/api/admin/enquiries?type=${encodeURIComponent(type)}` : "/api/admin/enquiries",
      updateStatus: (id: string) => `/api/admin/enquiries/${encodeURIComponent(id)}/status`,
    },
    locations: {
      cities: {
        list: "/api/admin/cities",
        create: "/api/admin/cities",
        update: (id: string) => `/api/admin/cities/${encodeURIComponent(id)}`,
        delete: (id: string) => `/api/admin/cities/${encodeURIComponent(id)}`,
      },
      pincodes: {
        list: (cityId: string) => `/api/admin/cities/${encodeURIComponent(cityId)}/pincodes`,
        add: (cityId: string) => `/api/admin/cities/${encodeURIComponent(cityId)}/pincodes`,
        delete: (pincodeId: string) => `/api/admin/pincodes/${encodeURIComponent(pincodeId)}`,
      }
    }
  },
  locations: {
    cities: "/api/locations/cities",
    checkPincode: (code: string) => `/api/locations/check-pincode?code=${encodeURIComponent(code)}`,
  },
  seo: {
    pages: "/api/seo/pages",
    pageByRoute: (route: string) => `/api/seo/pages/route?route=${encodeURIComponent(route)}`,
  },
} as const;
