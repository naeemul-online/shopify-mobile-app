import { useQuery } from '@tanstack/react-query';
import { GET_PRODUCT_BY_HANDLE_QUERY } from '../api/queries';
import { shopifyFetch } from '../api/shopify-client';
import { ProductDetail, ShopifyProductResponse } from '../types/shopify';

export async function fetchProductByHandle(handle: string): Promise<ProductDetail | null> {
  const response = await shopifyFetch<ShopifyProductResponse>(GET_PRODUCT_BY_HANDLE_QUERY, {
    handle,
  });
  return response.product;
}

export function useProduct(handle: string | undefined) {
  const query = useQuery({
    queryKey: ['product', handle],
    queryFn: () => {
      if (!handle) throw new Error('Product handle is required');
      return fetchProductByHandle(handle);
    },
    enabled: Boolean(handle),
  });

  return {
    ...query,
    product: query.data ?? null,
  };
}

