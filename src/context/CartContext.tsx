import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CREATE_CART_MUTATION,
  GET_CART_QUERY,
} from '../api/queries';
import { shopifyFetch } from '../api/shopify-client';
import {
  AddCartLinesResponse,
  Cart,
  CartQueryResponse,
  CreateCartResponse,
  RemoveCartLinesResponse,
  UpdateCartLinesResponse,
} from '../types/shopify';

const CART_STORAGE_KEY = 'shopify_cart_id';

export interface AddToCartParams {
  variantId: string;
  quantity: number;
}

interface CartContextType {
  cart: Cart | null;
  cartCount: number;
  isAddingToCart: boolean;
  isCheckingOut: boolean;
  addToCart: (params: AddToCartParams) => Promise<Cart | null>;
  buyNow: (params: AddToCartParams) => Promise<void>;
  checkout: (checkoutUrl?: string) => Promise<void>;
  updateCartLine: (lineId: string, quantity: number) => Promise<Cart | null>;
  removeCartLine: (lineId: string) => Promise<Cart | null>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

async function getStoredCartId(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined'
        ? window.localStorage?.getItem(CART_STORAGE_KEY)
        : null;
    }
    return await SecureStore.getItemAsync(CART_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function setStoredCartId(cartId: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem(CART_STORAGE_KEY, cartId);
      }
      return;
    }
    await SecureStore.setItemAsync(CART_STORAGE_KEY, cartId);
  } catch (err) {
    console.warn('Failed to store cart id:', err);
  }
}

async function removeStoredCartId(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage?.removeItem(CART_STORAGE_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(CART_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to delete cart id:', err);
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  // Restore cart on mount
  useEffect(() => {
    let isMounted = true;

    async function restoreCart() {
      const storedId = await getStoredCartId();
      if (!storedId || !isMounted) return;

      setCartId(storedId);
      try {
        const res = await shopifyFetch<CartQueryResponse>(GET_CART_QUERY, { cartId: storedId });
        if (isMounted && res.cart) {
          setCart(res.cart);
        }
      } catch {
        // If cart query fails (expired), clear stored cart
        if (isMounted) {
          setCartId(null);
          await removeStoredCartId();
        }
      }
    }

    restoreCart();
    return () => {
      isMounted = false;
    };
  }, []);

  const addToCartMutation = useMutation({
    mutationFn: async ({ variantId, quantity }: AddToCartParams): Promise<Cart> => {
      if (cartId) {
        try {
          const res = await shopifyFetch<AddCartLinesResponse>(CART_LINES_ADD_MUTATION, {
            cartId,
            lines: [{ merchandiseId: variantId, quantity }],
          });

          if (res.cartLinesAdd.userErrors.length > 0) {
            throw new Error(res.cartLinesAdd.userErrors[0].message);
          }

          if (res.cartLinesAdd.cart) {
            return res.cartLinesAdd.cart;
          }
        } catch {
          // If existing cart is invalid or expired, continue to create a new cart
        }
      }

      // Create new cart
      const res = await shopifyFetch<CreateCartResponse>(CREATE_CART_MUTATION, {
        lines: [{ merchandiseId: variantId, quantity }],
      });

      if (res.cartCreate.userErrors.length > 0) {
        throw new Error(res.cartCreate.userErrors[0].message);
      }

      if (!res.cartCreate.cart) {
        throw new Error('Failed to create cart');
      }

      const newCart = res.cartCreate.cart;
      setCartId(newCart.id);
      await setStoredCartId(newCart.id);
      return newCart;
    },
    onSuccess: (updatedCart) => {
      setCart(updatedCart);
    },
  });

  const addToCart = useCallback(
    async (params: AddToCartParams) => {
      return await addToCartMutation.mutateAsync(params);
    },
    [addToCartMutation]
  );

  const checkout = useCallback(async (customCheckoutUrl?: string) => {
    const targetUrl = customCheckoutUrl ?? cart?.checkoutUrl;
    if (!targetUrl) {
      console.warn('Cannot checkout: no checkout URL available.');
      return;
    }

    try {
      setIsCheckingOut(true);
      await WebBrowser.openBrowserAsync(targetUrl);
    } catch (err) {
      console.error('Error opening checkout:', err);
    } finally {
      setIsCheckingOut(false);
    }
  }, [cart?.checkoutUrl]);

  const buyNow = useCallback(
    async (params: AddToCartParams) => {
      try {
        setIsCheckingOut(true);
        const updatedCart = await addToCartMutation.mutateAsync(params);
        if (updatedCart?.checkoutUrl) {
          await WebBrowser.openBrowserAsync(updatedCart.checkoutUrl);
        }
      } catch (err) {
        console.error('Error during Buy Now:', err);
        throw err;
      } finally {
        setIsCheckingOut(false);
      }
    },
    [addToCartMutation]
  );

  const updateCartLine = useCallback(
    async (lineId: string, quantity: number): Promise<Cart | null> => {
      if (!cartId) return null;
      try {
        const res = await shopifyFetch<UpdateCartLinesResponse>(CART_LINES_UPDATE_MUTATION, {
          cartId,
          lines: [{ id: lineId, quantity }],
        });

        if (res.cartLinesUpdate.cart) {
          setCart(res.cartLinesUpdate.cart);
          return res.cartLinesUpdate.cart;
        }
      } catch (err) {
        console.error('Error updating cart line:', err);
      }
      return null;
    },
    [cartId]
  );

  const removeCartLine = useCallback(
    async (lineId: string): Promise<Cart | null> => {
      if (!cartId) return null;
      try {
        const res = await shopifyFetch<RemoveCartLinesResponse>(CART_LINES_REMOVE_MUTATION, {
          cartId,
          lineIds: [lineId],
        });

        if (res.cartLinesRemove.cart) {
          setCart(res.cartLinesRemove.cart);
          return res.cartLinesRemove.cart;
        }
      } catch (err) {
        console.error('Error removing cart line:', err);
      }
      return null;
    },
    [cartId]
  );

  const clearCart = useCallback(async () => {
    setCart(null);
    setCartId(null);
    await removeStoredCartId();
  }, []);

  const cartCount = cart?.totalQuantity ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        isAddingToCart: addToCartMutation.isPending,
        isCheckingOut,
        addToCart,
        buyNow,
        checkout,
        updateCartLine,
        removeCartLine,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
