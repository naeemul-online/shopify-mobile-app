import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ProductCard } from '@/components/ProductCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCart } from '@/src/context/CartContext';
import { useProducts } from '@/src/hooks/useProducts';
import { Product } from '@/src/types/shopify';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    products,
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProducts({ pageSize: 10 });

  const { addToCart, buyNow } = useCart();

  const handleProductPress = useCallback((product: Product) => {
    router.push({
      pathname: `/product/${product.handle}` as any,
    });
  }, []);

  const handleAddToCart = useCallback(
    async (_product: Product, variantId: string) => {
      await addToCart({ variantId, quantity: 1 });
    },
    [addToCart]
  );

  const handleBuyNow = useCallback(
    async (_product: Product, variantId: string) => {
      await buyNow({ variantId, quantity: 1 });
    },
    [buyNow]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderProductItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
      const isLeft = index % 2 === 0;
      return (
        <ProductCard
          product={item}
          onPress={handleProductPress}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          style={isLeft ? styles.leftCard : styles.rightCard}
        />
      );
    },
    [handleProductPress, handleAddToCart, handleBuyNow]
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={[styles.headerSubtitle, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
          CURATED COLLECTION
        </Text>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>
          Featured Products
        </Text>
      </View>

      {!isLoading && !isError && products.length > 0 && (
        <View
          style={[
            styles.countBadge,
            { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' },
          ]}
        >
          <Text style={[styles.countText, { color: isDark ? '#FFF' : '#000' }]}>
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) {
      return <View style={styles.bottomSpacer} />;
    }

    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={isDark ? '#FFF' : '#007AFF'} />
        <Text style={[styles.footerText, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
          Loading more items...
        </Text>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={isDark ? '#FFF' : '#007AFF'} />
          <Text style={[styles.stateTitle, { color: Colors[colorScheme].text }]}>
            Loading Products
          </Text>
          <Text style={[styles.stateSubtitle, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
            Fetching the latest catalog from Shopify...
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.stateContainer}>
          <SymbolView
            name={{ ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' }}
            size={48}
            tintColor={isDark ? '#FF453A' : '#FF3B30'}
          />
          <Text style={[styles.stateTitle, { color: Colors[colorScheme].text }]}>
            Failed to Load Products
          </Text>
          <Text style={[styles.stateSubtitle, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={({ pressed }) => [
              styles.retryButton,
              {
                backgroundColor: isDark ? '#0A84FF' : '#007AFF',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Retry loading products"
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.stateContainer}>
        <SymbolView
          name={{ ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' }}
          size={48}
          tintColor={isDark ? '#8E8E93' : '#AEAEB2'}
        />
        <Text style={[styles.stateTitle, { color: Colors[colorScheme].text }]}>
          No Products Found
        </Text>
        <Text style={[styles.stateSubtitle, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
          Check back later for new arrivals in our store.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#000000' : '#F2F2F7' },
      ]}
    >
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        numColumns={2}
        columnWrapperStyle={products.length > 0 ? styles.columnWrapper : undefined}
        contentContainerStyle={[
          styles.contentContainer,
          products.length === 0 && styles.emptyContentContainer,
        ]}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={isDark ? '#FFF' : '#007AFF'}
            colors={['#007AFF']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },
  leftCard: {
    marginRight: 6,
  },
  rightCard: {
    marginLeft: 6,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
  },
  bottomSpacer: {
    height: 16,
  },
});
