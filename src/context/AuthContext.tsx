import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
  CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION,
  CUSTOMER_CREATE_MUTATION,
  CUSTOMER_UPDATE_MUTATION,
  GET_CUSTOMER_QUERY,
} from '../api/queries';
import { shopifyFetch } from '../api/shopify-client';
import {
  CustomerAccessTokenCreateResponse,
  CustomerAccessTokenDeleteResponse,
  CustomerCreateResponse,
  CustomerProfile,
  CustomerQueryResponse,
  CustomerUpdateResponse,
} from '../types/shopify';

const AUTH_STORAGE_KEY = 'shopify_customer_access_token';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateProfileParams {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface AuthContextType {
  token: string | null;
  customer: CustomerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  isRegistering: boolean;
  isUpdatingProfile: boolean;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  updateProfile: (params: UpdateProfileParams) => Promise<void>;
  logout: () => Promise<void>;
  refetchCustomer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined'
        ? window.localStorage?.getItem(AUTH_STORAGE_KEY)
        : null;
    }
    return await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function setStoredToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem(AUTH_STORAGE_KEY, token);
      }
      return;
    }
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, token);
  } catch (err) {
    console.warn('Failed to store customer token:', err);
  }
}

async function removeStoredToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage?.removeItem(AUTH_STORAGE_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to delete customer token:', err);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(true);

  // Restore token from SecureStore on mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const stored = await getStoredToken();
        if (isMounted && stored) {
          setToken(stored);
        }
      } finally {
        if (isMounted) {
          setIsRestoring(false);
        }
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch customer profile and orders when token is active
  const {
    data: customerData,
    isLoading: isCustomerLoading,
    refetch: refetchCustomer,
  } = useQuery({
    queryKey: ['customer', token],
    queryFn: async () => {
      if (!token) return null;
      try {
        const res = await shopifyFetch<CustomerQueryResponse>(GET_CUSTOMER_QUERY, {
          customerAccessToken: token,
        });
        return res.customer;
      } catch (err) {
        // If query fails due to invalid or expired token, revoke local session
        console.warn('Customer session invalid or expired:', err);
        setToken(null);
        await removeStoredToken();
        return null;
      }
    },
    enabled: Boolean(token),
  });

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: LoginParams) => {
      const res = await shopifyFetch<CustomerAccessTokenCreateResponse>(
        CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
        {
          input: { email, password },
        }
      );

      const errors = res.customerAccessTokenCreate.customerUserErrors;
      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const createdToken = res.customerAccessTokenCreate.customerAccessToken;
      if (!createdToken?.accessToken) {
        throw new Error('Failed to create customer access token');
      }

      return createdToken.accessToken;
    },
    onSuccess: async (newToken) => {
      setToken(newToken);
      await setStoredToken(newToken);
      queryClient.invalidateQueries({ queryKey: ['customer', newToken] });
    },
  });

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: async ({ email, password, firstName, lastName }: RegisterParams) => {
      const res = await shopifyFetch<CustomerCreateResponse>(CUSTOMER_CREATE_MUTATION, {
        input: {
          email,
          password,
          firstName: firstName?.trim() || undefined,
          lastName: lastName?.trim() || undefined,
        },
      });

      const errors = res.customerCreate.customerUserErrors;
      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      // Automatically log the customer in after registration
      return await loginMutation.mutateAsync({ email, password });
    },
  });

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ firstName, lastName, phone }: UpdateProfileParams) => {
      if (!token) throw new Error('Not authenticated');

      const res = await shopifyFetch<CustomerUpdateResponse>(CUSTOMER_UPDATE_MUTATION, {
        customerAccessToken: token,
        customer: {
          firstName: firstName?.trim() || undefined,
          lastName: lastName?.trim() || undefined,
          phone: phone?.trim() || undefined,
        },
      });

      const errors = res.customerUpdate.customerUserErrors;
      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      return res.customerUpdate.customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', token] });
    },
  });

  const login = useCallback(
    async (params: LoginParams) => {
      await loginMutation.mutateAsync(params);
    },
    [loginMutation]
  );

  const register = useCallback(
    async (params: RegisterParams) => {
      await registerMutation.mutateAsync(params);
    },
    [registerMutation]
  );

  const updateProfile = useCallback(
    async (params: UpdateProfileParams) => {
      await updateProfileMutation.mutateAsync(params);
    },
    [updateProfileMutation]
  );

  const logout = useCallback(async () => {
    if (token) {
      try {
        await shopifyFetch<CustomerAccessTokenDeleteResponse>(
          CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION,
          {
            customerAccessToken: token,
          }
        );
      } catch (err) {
        console.warn('Failed to delete customer access token on server:', err);
      }
    }

    setToken(null);
    await removeStoredToken();
    queryClient.removeQueries({ queryKey: ['customer'] });
  }, [token, queryClient]);

  const customer = customerData ?? null;
  const isAuthenticated = Boolean(token && customer);
  const isLoading = isRestoring || (Boolean(token) && isCustomerLoading);

  return (
    <AuthContext.Provider
      value={{
        token,
        customer,
        isAuthenticated,
        isLoading,
        isLoggingIn: loginMutation.isPending,
        isRegistering: registerMutation.isPending,
        isUpdatingProfile: updateProfileMutation.isPending,
        login,
        register,
        updateProfile,
        logout,
        refetchCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

