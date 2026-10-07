import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { VariantSelector } from '@/components/VariantSelector';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCart } from '@/src/context/CartContext';
import { useProduct } from '@/src/hooks/useProduct';
import { formatPrice, ProductVariant, ShopifyImage } from '@/src/types/shopify';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { product, isLoading, isError, error, refetch, isRefetching } = useProduct(
    typeof handle === 'string' ? handle : undefined
  );
  const { addToCart, buyNow, isAddingToCart, isCheckingOut, cartCount } = useCart();

  const [customSelectedOptions, setCustomSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showAddedBanner, setShowAddedBanner] = useState<boolean>(false);
  const imageListRef = useRef<FlatList>(null);

  // Derive default options from product without setState in effect
  const defaultOptions = useMemo(() => {
    if (!product || !product.options.length) return {};
    const initial: Record<string, string> = {};
    const defaultVariant =
      product.variants.edges.find((e) => e.node.availableForSale)?.node ??
      product.variants.edges[0]?.node;

    if (defaultVariant) {
      defaultVariant.selectedOptions.forEach((opt) => {
        initial[opt.name] = opt.value;
      });
    } else {
      product.options.forEach((opt) => {
        if (opt.values.length > 0) {
          initial[opt.name] = opt.values[0];
        }
      });
    }
    return initial;
  }, [product]);

  // Combine default options with user selections
  const selectedOptions = useMemo(
    () => ({ ...defaultOptions, ...customSelectedOptions }),
    [defaultOptions, customSelectedOptions]
  );

  // Gallery images: combine all product images
  const images: ShopifyImage[] = useMemo(() => {
    if (!product) return [];
    const extracted = product.images.edges.map((e) => e.node);
    if (extracted.length > 0) return extracted;
    if (product.featuredImage) return [product.featuredImage];
    return [];
  }, [product]);

  // Determine current active variant based on selected options
  const currentVariant: ProductVariant | null = useMemo(() => {
    if (!product || !product.variants?.edges?.length) return null;

    const matched = product.variants.edges.find((edge) => {
      return edge.node.selectedOptions.every(
        (opt) => selectedOptions[opt.name] === opt.value
      );
    });

    return matched?.node ?? product.variants.edges[0]?.node ?? null;
  }, [product, selectedOptions]);

  const handleSelectOption = (name: string, value: string) => {
    const nextOptions = {
      ...selectedOptions,
      [name]: value,
    };
    setCustomSelectedOptions((prev) => ({
      ...prev,
      [name]: value,
    }));

    // If selected variant has an image, scroll to it immediately
    if (product && product.variants?.edges?.length) {
      const nextVariant = product.variants.edges.find((edge) =>
        edge.node.selectedOptions.every((opt) => nextOptions[opt.name] === opt.value)
      )?.node;

      if (nextVariant?.image?.url && images.length > 1) {
        const idx = images.findIndex((img) => img.url === nextVariant.image?.url);
        if (idx !== -1) {
          imageListRef.current?.scrollToIndex({ index: idx, animated: true });
          setActiveImageIndex(idx);
        }
      }
    }
  };

  const handleAddToCart = async () => {
    if (!currentVariant || !currentVariant.availableForSale || isAddingToCart) return;

    try {
      await addToCart({
        variantId: currentVariant.id,
        quantity,
      });

      setShowAddedBanner(true);
      setTimeout(() => {
        setShowAddedBanner(false);
      }, 2500);
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const handleBuyNow = async () => {
    if (!currentVariant || !currentVariant.availableForSale || isAddingToCart || isCheckingOut) return;

    try {
      await buyNow({
        variantId: currentVariant.id,
        quantity,
      });
    } catch (err) {
      console.error('Error during Buy Now:', err);
    }
  };

  const handleImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activeImageIndex && index >= 0 && index < images.length) {
      setActiveImageIndex(index);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
        <Stack.Screen options={{ title: 'Loading...', headerShown: true }} />
        <ActivityIndicator size="large" color={isDark ? '#FFF' : '#007AFF'} />
        <Text style={[styles.loadingText, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
          Loading product details...
        </Text>
      </SafeAreaView>
    );
  }

  if (isError || !product) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
        <Stack.Screen options={{ title: 'Product', headerShown: true }} />
        <SymbolView
          name={{ ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' }}
          size={48}
          tintColor={isDark ? '#FF453A' : '#FF3B30'}
        />
        <Text style={[styles.errorTitle, { color: Colors[colorScheme].text }]}>
          Unable to Load Product
        </Text>
        <Text style={[styles.errorSubtitle, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
          {error instanceof Error ? error.message : 'Product not found'}
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={({ pressed }) => [
            styles.retryBtn,
            { backgroundColor: isDark ? '#0A84FF' : '#007AFF', opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isAvailable = currentVariant?.availableForSale ?? product.availableForSale;
  const currentPrice = currentVariant?.price
    ? formatPrice(currentVariant.price.amount, currentVariant.price.currencyCode)
    : formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode);

  const unitPriceAmount = currentVariant?.price
    ? currentVariant.price.amount
    : product.priceRange.minVariantPrice.amount;
  const currencyCode = currentVariant?.price
    ? currentVariant.price.currencyCode
    : product.priceRange.minVariantPrice.currencyCode;
  const totalPrice = formatPrice(
    (parseFloat(unitPriceAmount) * quantity).toString(),
    currencyCode
  );

  const comparePrice = currentVariant?.compareAtPrice
    ? formatPrice(currentVariant.compareAtPrice.amount, currentVariant.compareAtPrice.currencyCode)
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: product.title,
          headerBackTitle: 'Catalog',
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable
                style={styles.headerCart}
                accessibilityRole="button"
                accessibilityLabel={`Shopping cart, ${cartCount} items`}
              >
                <SymbolView
                  name={{ ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' }}
                  size={22}
                  tintColor={Colors[colorScheme].text}
                />
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount}</Text>
                  </View>
                )}
              </Pressable>
            </Link>
          ),
        }}
      />

      {showAddedBanner && (
        <View style={styles.successBanner}>
          <SymbolView
            name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
            size={20}
            tintColor="#FFF"
          />
          <Text style={styles.successBannerText}>Added to cart successfully!</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={isDark ? '#FFF' : '#007AFF'}
          />
        }
      >
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          {images.length > 0 ? (
            <>
              <FlatList
                ref={imageListRef}
                data={images}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleImageScroll}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                  <View style={styles.imageSlide}>
                    <Image
                      source={{ uri: item.url }}
                      style={styles.productImage}
                      resizeMode="cover"
                      accessibilityLabel={item.altText ?? product.title}
                    />
                  </View>
                )}
              />
              {images.length > 1 && (
                <View style={styles.paginationDots}>
                  {images.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            idx === activeImageIndex
                              ? isDark
                                ? '#FFF'
                                : '#000'
                              : isDark
                                ? '#3A3A3C'
                                : '#D1D1D6',
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
              <SymbolView
                name={{ ios: 'photo', android: 'image', web: 'image' }}
                size={54}
                tintColor={isDark ? '#48484A' : '#AEAEB2'}
              />
            </View>
          )}
        </View>

        {/* Product Details Header */}
        <View style={styles.detailsSection}>
          <View style={styles.availabilityRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isAvailable
                    ? isDark
                      ? 'rgba(48, 209, 88, 0.15)'
                      : 'rgba(52, 199, 89, 0.12)'
                    : isDark
                      ? 'rgba(255, 69, 58, 0.15)'
                      : 'rgba(255, 59, 48, 0.12)',
                },
              ]}
            >
              <View
                style={[
                  styles.badgeDot,
                  { backgroundColor: isAvailable ? '#34C759' : '#FF3B30' },
                ]}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: isAvailable ? (isDark ? '#30D158' : '#28A745') : '#FF3B30' },
                ]}
              >
                {isAvailable ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>

          <Text style={[styles.productTitle, { color: Colors[colorScheme].text }]}>
            {product.title}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.priceText, { color: Colors[colorScheme].text }]}>
              {currentPrice}
            </Text>
            {comparePrice && (
              <Text style={[styles.comparePriceText, { color: isDark ? '#8E8E93' : '#8E8E93' }]}>
                {comparePrice}
              </Text>
            )}
          </View>
        </View>

        {/* Variant Selectors */}
        {product.options && (
          <VariantSelector
            options={product.options}
            selectedOptions={selectedOptions}
            onSelectOption={handleSelectOption}
          />
        )}

        {/* Quantity Stepper */}
        <View style={styles.quantitySection}>
          <Text style={[styles.quantityLabel, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
            QUANTITY
          </Text>
          <View
            style={[
              styles.stepperContainer,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
                borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
              },
            ]}
          >
            <Pressable
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              style={({ pressed }) => [
                styles.stepperBtn,
                { opacity: quantity <= 1 ? 0.3 : pressed ? 0.6 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
            >
              <Text style={[styles.stepperBtnText, { color: Colors[colorScheme].text }]}>−</Text>
            </Pressable>

            <Text style={[styles.stepperValue, { color: Colors[colorScheme].text }]}>
              {quantity}
            </Text>

            <Pressable
              onPress={() => setQuantity((q) => Math.min(10, q + 1))}
              disabled={quantity >= 10}
              style={({ pressed }) => [
                styles.stepperBtn,
                { opacity: quantity >= 10 ? 0.3 : pressed ? 0.6 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
            >
              <Text style={[styles.stepperBtnText, { color: Colors[colorScheme].text }]}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Description Section */}
        {Boolean(product.description) && (
          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
              Description
            </Text>
            <Text
              style={[
                styles.descriptionText,
                { color: isDark ? '#AEAEB2' : '#3C3C43' },
              ]}
            >
              {product.description}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA',
          },
        ]}
      >
        <View style={styles.bottomBarPriceContainer}>
          <Text style={[styles.bottomBarLabel, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
            Total ({quantity} {quantity === 1 ? 'item' : 'items'})
          </Text>
          <Text style={[styles.bottomBarPrice, { color: Colors[colorScheme].text }]}>
            {totalPrice}
          </Text>
        </View>

        <View style={styles.bottomBarActions}>
          <Pressable
            onPress={handleAddToCart}
            disabled={!isAvailable || isAddingToCart || isCheckingOut}
            style={({ pressed }) => [
              styles.addToCartSecondaryBtn,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                borderColor: isDark ? '#3A3A3C' : '#D1D1D6',
                opacity: !isAvailable ? 0.4 : pressed ? 0.75 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isAvailable ? 'Add to cart' : 'Out of stock'}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color={isDark ? '#FFF' : '#000'} />
            ) : (
              <>
                <SymbolView
                  name={{ ios: 'cart.badge.plus', android: 'add_shopping_cart', web: 'add_shopping_cart' }}
                  size={18}
                  tintColor={isDark ? '#FFF' : '#000'}
                />
                <Text
                  style={[
                    styles.addToCartSecondaryText,
                    { color: Colors[colorScheme].text },
                  ]}
                >
                  Add
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handleBuyNow}
            disabled={!isAvailable || isAddingToCart || isCheckingOut}
            style={({ pressed }) => [
              styles.buyNowPrimaryBtn,
              {
                backgroundColor: !isAvailable
                  ? isDark
                    ? '#2C2C2E'
                    : '#C7C7CC'
                  : isDark
                    ? '#0A84FF'
                    : '#007AFF',
                opacity: !isAvailable ? 0.4 : pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isAvailable ? 'Buy now' : 'Sold out'}
          >
            {isCheckingOut ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buyNowPrimaryText}>
                {isAvailable ? 'Buy Now' : 'Sold Out'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  headerCart: {
    position: 'relative',
    padding: 4,
    marginRight: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  successBanner: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  successBannerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  galleryContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    position: 'relative',
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  availabilityRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  comparePriceText: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  quantitySection: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '600',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  descriptionSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
  },
  bottomBarPriceContainer: {
    flex: 1,
  },
  bottomBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBarPrice: {
    fontSize: 20,
    fontWeight: '800',
  },
  bottomBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToCartSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  addToCartSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  buyNowPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    minWidth: 100,
  },
  buyNowPrimaryText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
