import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { productsService } from "@/services/products.service";
import { categoriesService, brandsService, bannersService } from "@/services/catalog.service";
import { manufacturersService } from "@/services/manufacturers.service";
import { vehiclesService } from "@/services/vehicles.service";
import { cartService } from "@/services/cart.service";
import { ordersService } from "@/services/orders.service";
import { adminService } from "@/services/admin.service";
import { partnerDashboardService } from "@/services/partner-dashboard.service";
import { seoQuickLinksService } from "@/services/seo.service";
import { faqService } from "@/services/faq.service";
import type { ProductFilterParams } from "@/types/dto";

import { useLocationStore } from "@/store/useLocationStore";

export const productListQuery = () => {
  const cityId = useLocationStore.getState().city?.cityId;
  return queryOptions({
    queryKey: queryKeys.products.list(cityId),
    queryFn: ({ signal }) => productsService.list(cityId, signal),
    staleTime: 60_000,
  });
};

export const productFilterQuery = (params: ProductFilterParams) => {
  const cityId = useLocationStore.getState().city?.cityId;
  return queryOptions({
    queryKey: queryKeys.products.filter({ ...params, cityId }),
    queryFn: ({ signal }) => productsService.filter({ ...params, cityId }, signal),
    staleTime: 30_000,
  });
};

export const productDetailQuery = (id: string) => {
  const cityId = useLocationStore.getState().city?.cityId;
  return queryOptions({
    queryKey: queryKeys.products.detail(id, cityId),
    queryFn: ({ signal }) => productsService.byId(id, cityId, signal),
    staleTime: 60_000,
  });
};

export const categoriesQuery = () =>
  queryOptions({
    queryKey: queryKeys.categories.list(),
    queryFn: ({ signal }) => categoriesService.list(signal),
    staleTime: 5 * 60_000,
  });

export const rootCategoriesQuery = () =>
  queryOptions({
    queryKey: queryKeys.categories.root(),
    queryFn: ({ signal }) => categoriesService.root(signal),
    staleTime: 5 * 60_000,
  });

export const brandsQuery = () =>
  queryOptions({
    queryKey: queryKeys.brands.list(),
    queryFn: ({ signal }) => brandsService.list(signal),
    staleTime: 5 * 60_000,
  });

export const capacitiesQuery = (categoryId?: string) =>
  queryOptions({
    queryKey: ["capacities", categoryId],
    queryFn: () => adminService.getAllCapacities(categoryId),
    staleTime: 5 * 60_000,
  });

export const fuelsQuery = () =>
  queryOptions({
    queryKey: ["admin", "fuels"],
    queryFn: () => adminService.getAllFuels(),
    staleTime: 5 * 60_000,
  });

export const manufacturersListQuery = () =>
  queryOptions({
    queryKey: queryKeys.manufacturers.list(),
    queryFn: ({ signal }) => manufacturersService.list(signal),
    staleTime: 10 * 60_000,
  });

export const featuredBrandsQuery = () =>
  queryOptions({
    queryKey: queryKeys.brands.featured(),
    queryFn: ({ signal }) => brandsService.featured(signal),
    staleTime: 5 * 60_000,
  });

export const vehiclesListQuery = () =>
  queryOptions({
    queryKey: queryKeys.vehicles.list(),
    queryFn: ({ signal }) => vehiclesService.list(signal),
    staleTime: 10 * 60_000,
  });

export const vehiclesSearchQuery = (params: { make?: string; model?: string }) =>
  queryOptions({
    queryKey: queryKeys.vehicles.search(params.make, params.model),
    queryFn: ({ signal }) => vehiclesService.search(params, signal),
    staleTime: 5 * 60_000,
    enabled: !!(params.make || params.model),
  });

export const cartQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: queryKeys.cart.current(),
    queryFn: ({ signal }) => cartService.get(signal),
    enabled,
    staleTime: 15_000,
  });

export const ordersListQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: queryKeys.orders.list(),
    queryFn: ({ signal }) => ordersService.list(signal),
    enabled,
    staleTime: 30_000,
  });

export const orderDetailQuery = (orderId: string) =>
  queryOptions({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: ({ signal }) => ordersService.byId(orderId, signal),
    staleTime: 30_000,
  });

import { userService } from "@/services/user.service";

export const userProfileQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: queryKeys.user.profile(),
    queryFn: ({ signal }) => userService.getProfile(signal),
    enabled,
    staleTime: 60_000,
  });

import { addressesService } from "@/services/addresses.service";

export const addressesQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: queryKeys.addresses.list(),
    queryFn: ({ signal }) => addressesService.list(signal),
    enabled,
    staleTime: 5 * 60_000,
  });


export const adminUsersQuery = () =>
  queryOptions({
    queryKey: queryKeys.admin.users(),
    queryFn: () => adminService.getAllUsers(),
    staleTime: 60_000,
  });

export const bannersListQuery = () =>
  queryOptions({
    queryKey: queryKeys.banners.active(),
    queryFn: ({ signal }) => bannersService.active(signal),
    staleTime: 60_000,
  });

export const adminOrdersQuery = () =>
  queryOptions({
    queryKey: queryKeys.admin.orders(),
    queryFn: () => adminService.getAllOrders(),
    staleTime: 10_000,
    refetchInterval: 15_000, // Poll every 15 seconds
  });

export const adminFaqsQuery = () =>
  queryOptions({
    queryKey: ["admin", "faqs"],
    queryFn: () => faqService.getAllFaqs(),
    staleTime: 60_000,
  });

export const publicFaqsQuery = (pageType: string) =>
  queryOptions({
    queryKey: ["faqs", "public", pageType],
    queryFn: () => faqService.getPublicFaqsByPage(pageType),
    staleTime: 300_000, // Cache for 5 mins
  });
