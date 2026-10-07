import { useInfiniteQuery } from "@tanstack/react-query";
import { GET_PRODUCTS_QUERY } from "../api/queries";
import { shopifyFetch } from "../api/shopify-client";
import { Product, ShopifyProductsResponse } from "../types/shopify";

interface UseProductsOptions {
  pageSize?: number;
}

export async function fetchProducts(pageSize: number = 10, cursor?: string | null) {
  const response = await shopifyFetch<ShopifyProductsResponse>(GET_PRODUCTS_QUERY, {
    first: pageSize,
    after: cursor ?? null,
  });
  return response.products;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { pageSize = 10 } = options;

  const query = useInfiniteQuery({
    queryKey: ["products", { pageSize }],
    queryFn: async ({ pageParam }) => {
      return fetchProducts(pageSize, pageParam);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      return lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined;
    },
  });

  const products: Product[] =
    query.data?.pages.flatMap((page) => page.edges.map((edge) => edge.node)) ?? [];

  return {
    ...query,
    products,
  };
}

