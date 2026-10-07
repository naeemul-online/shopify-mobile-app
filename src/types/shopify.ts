export interface ShopifyImage {
  url: string;
  altText: string | null;
}

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface PriceRange {
  minVariantPrice: Money;
  maxVariantPrice?: Money;
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  featuredImage: ShopifyImage | null;
  priceRange: PriceRange;
  variants?: {
    edges: {
      node: ProductVariant;
    }[];
  };
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: SelectedOption[];
  image: ShopifyImage | null;
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface ProductDetail extends Product {
  descriptionHtml?: string;
  availableForSale: boolean;
  images: {
    edges: {
      node: ShopifyImage;
    }[];
  };
  options: ProductOption[];
  variants: {
    edges: {
      node: ProductVariant;
    }[];
  };
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface ProductEdge {
  cursor: string;
  node: Product;
}

export interface ShopifyProductsResponse {
  products: {
    pageInfo: PageInfo;
    edges: ProductEdge[];
  };
}

export interface ShopifyProductResponse {
  product: ProductDetail | null;
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: Money;
    image?: ShopifyImage | null;
    product: {
      title: string;
      handle?: string;
    };
  };
}

export interface CartCost {
  totalAmount: Money;
  subtotalAmount?: Money;
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines?: {
    edges: {
      node: CartLine;
    }[];
  };
  cost?: CartCost;
}

export interface CartQueryResponse {
  cart: Cart | null;
}

export interface CartUserError {
  field: string[];
  message: string;
}

export interface CartResponse {
  cart: Cart | null;
  userErrors: CartUserError[];
}

export interface CreateCartResponse {
  cartCreate: CartResponse;
}

export interface AddCartLinesResponse {
  cartLinesAdd: CartResponse;
}

export interface RemoveCartLinesResponse {
  cartLinesRemove: CartResponse;
}

export interface UpdateCartLinesResponse {
  cartLinesUpdate: CartResponse;
}

export interface CustomerAccessToken {
  accessToken: string;
  expiresAt: string;
}

export interface CustomerUserError {
  code?: string;
  field?: string[] | null;
  message: string;
}

export interface CustomerAccessTokenCreateResponse {
  customerAccessTokenCreate: {
    customerAccessToken: CustomerAccessToken | null;
    customerUserErrors: CustomerUserError[];
  };
}

export interface CustomerAccessTokenDeleteResponse {
  customerAccessTokenDelete: {
    deletedAccessToken: string | null;
    deletedCustomerAccessTokenId: string | null;
    userErrors: CustomerUserError[];
  };
}

export interface CustomerCreateResponse {
  customerCreate: {
    customer: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
    customerUserErrors: CustomerUserError[];
  };
}

export interface CustomerUpdateResponse {
  customerUpdate: {
    customer: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      email?: string;
    } | null;
    customerUserErrors: CustomerUserError[];
  };
}

export interface OrderLineItem {
  title: string;
  quantity: number;
  variant: {
    title: string;
    image?: ShopifyImage | null;
    price: Money;
  } | null;
}

export interface CustomerOrder {
  id: string;
  name: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: Money;
  lineItems: {
    edges: {
      node: OrderLineItem;
    }[];
  };
}

export interface CustomerProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  email: string;
  phone: string | null;
  numberOfOrders: string;
  orders: {
    edges: {
      node: CustomerOrder;
    }[];
  };
}

export interface CustomerQueryResponse {
  customer: CustomerProfile | null;
}

export function formatPrice(amount: string, currencyCode: string): string {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) {
    return `${currencyCode} ${amount}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(numericAmount);
  } catch {
    return `${currencyCode} ${numericAmount.toFixed(2)}`;
  }
}
