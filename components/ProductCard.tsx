import Colors from '@/constants/Colors';
import { Product, formatPrice } from '@/src/types/shopify';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useColorScheme } from './useColorScheme';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onAddToCart?: (product: Product, variantId: string) => Promise<void> | void;
  onBuyNow?: (product: Product, variantId: string) => Promise<void> | void;
  style?: StyleProp<ViewStyle>;
}

export function ProductCard({
  product,
  onPress,
  onAddToCart,
  onBuyNow,
  style,
}: ProductCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const priceFormatted = formatPrice(
    product.priceRange.minVariantPrice.amount,
    product.priceRange.minVariantPrice.currencyCode
  );

  const defaultVariant = product.variants?.edges?.[0]?.node;
  const isAvailable = defaultVariant ? defaultVariant.availableForSale : true;
  const variantId = defaultVariant?.id;

  const handleAddToCart = async (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (!variantId || !isAvailable || isAdding || isBuying) return;

    if (onAddToCart) {
      try {
        setIsAdding(true);
        await onAddToCart(product, variantId);
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleBuyNow = async (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (!variantId || !isAvailable || isAdding || isBuying) return;

    if (onBuyNow) {
      try {
        setIsBuying(true);
        await onBuyNow(product, variantId);
      } finally {
        setIsBuying(false);
      }
    }
  };

  return (
    <Pressable
      onPress={() => onPress(product)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${priceFormatted}`}
      accessibilityHint="Opens product details"
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      <View style={[styles.imageContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
        {product.featuredImage?.url ? (
          <Image
            source={{ uri: product.featuredImage.url }}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel={product.featuredImage.altText ?? product.title}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <SymbolView
              name={{ ios: 'photo', android: 'image', web: 'image' }}
              size={36}
              tintColor={isDark ? '#8E8E93' : '#AEAEB2'}
            />
          </View>
        )}

        {!isAvailable && (
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>Out of Stock</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text
          numberOfLines={2}
          style={[styles.title, { color: Colors[colorScheme].text }]}
        >
          {product.title}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: isDark ? '#30D158' : '#007AFF' }]}>
            {priceFormatted}
          </Text>
        </View>

        {/* Action Buttons: Add to Cart & Buy Now */}
        <View style={styles.actionsContainer}>
          <Pressable
            onPress={handleAddToCart}
            disabled={!isAvailable || isAdding || isBuying}
            accessibilityRole="button"
            accessibilityLabel="Add to Cart"
            style={({ pressed }) => [
              styles.cartBtn,
              {
                borderColor: isDark ? '#3A3A3C' : '#D1D1D6',
                backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                opacity: !isAvailable ? 0.4 : pressed ? 0.7 : 1,
              },
            ]}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={isDark ? '#FFF' : '#000'} />
            ) : (
              <SymbolView
                name={{ ios: 'cart.badge.plus', android: 'add_shopping_cart', web: 'add_shopping_cart' }}
                size={16}
                tintColor={isDark ? '#FFF' : '#000'}
              />
            )}
          </Pressable>

          <Pressable
            onPress={handleBuyNow}
            disabled={!isAvailable || isAdding || isBuying}
            accessibilityRole="button"
            accessibilityLabel="Buy Now"
            style={({ pressed }) => [
              styles.buyNowBtn,
              {
                backgroundColor: !isAvailable
                  ? isDark
                    ? '#2C2C2E'
                    : '#C7C7CC'
                  : isDark
                    ? '#0A84FF'
                    : '#007AFF',
                opacity: !isAvailable ? 0.4 : pressed ? 0.8 : 1,
              },
            ]}
          >
            {isBuying ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buyNowText}>Buy Now</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldOutText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoContainer: {
    padding: 12,
    justifyContent: 'space-between',
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 10,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cartBtn: {
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
