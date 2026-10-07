import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCart } from '@/src/context/CartContext';
import { CartLine, formatPrice } from '@/src/types/shopify';

export default function CartModalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    cart,
    cartCount,
    checkout,
    isCheckingOut,
    updateCartLine,
    removeCartLine,
    clearCart,
  } = useCart();

  const [updatingLineId, setUpdatingLineId] = useState<string | null>(null);

  const cartLines: CartLine[] =
    cart?.lines?.edges?.map((e) => e.node) ?? [];

  const totalAmount = cart?.cost?.totalAmount
    ? formatPrice(cart.cost.totalAmount.amount, cart.cost.totalAmount.currencyCode)
    : '$0.00';

  const handleUpdateQuantity = async (lineId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    setUpdatingLineId(lineId);
    try {
      if (newQty <= 0) {
        await removeCartLine(lineId);
      } else {
        await updateCartLine(lineId, newQty);
      }
    } finally {
      setUpdatingLineId(null);
    }
  };

  const handleRemove = async (lineId: string) => {
    setUpdatingLineId(lineId);
    try {
      await removeCartLine(lineId);
    } finally {
      setUpdatingLineId(null);
    }
  };

  const handleProceedToCheckout = async () => {
    if (!cart?.checkoutUrl || isCheckingOut) return;
    await checkout();
  };

  const renderCartItem = ({ item }: { item: CartLine }) => {
    const isBusy = updatingLineId === item.id;
    const priceFormatted = formatPrice(
      item.merchandise.price.amount,
      item.merchandise.price.currencyCode
    );
    const lineTotal = formatPrice(
      (parseFloat(item.merchandise.price.amount) * item.quantity).toString(),
      item.merchandise.price.currencyCode
    );

    const isDefaultTitle =
      item.merchandise.title.toLowerCase() === 'default title' ||
      item.merchandise.title.toLowerCase() === 'title';

    return (
      <View
        style={[
          styles.cartItemCard,
          {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
          },
        ]}
      >
        <View
          style={[
            styles.itemThumbnailContainer,
            { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
          ]}
        >
          {item.merchandise.image?.url ? (
            <Image
              source={{ uri: item.merchandise.image.url }}
              style={styles.itemThumbnail}
              resizeMode="cover"
            />
          ) : (
            <SymbolView
              name={{ ios: 'photo', android: 'image', web: 'image' }}
              size={24}
              tintColor={isDark ? '#8E8E93' : '#AEAEB2'}
            />
          )}
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.itemHeaderRow}>
            <Text
              numberOfLines={2}
              style={[styles.itemTitle, { color: Colors[colorScheme].text }]}
            >
              {item.merchandise.product.title}
            </Text>
            <Pressable
              onPress={() => handleRemove(item.id)}
              disabled={isBusy}
              style={styles.removeBtn}
              accessibilityRole="button"
              accessibilityLabel="Remove item"
            >
              <SymbolView
                name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                size={16}
                tintColor={isDark ? '#8E8E93' : '#AEAEB2'}
              />
            </Pressable>
          </View>

          {!isDefaultTitle && (
            <Text style={[styles.itemVariant, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
              {item.merchandise.title}
            </Text>
          )}

          <View style={styles.itemPriceAndQuantityRow}>
            <View>
              <Text style={[styles.itemUnitPrice, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
                {priceFormatted} each
              </Text>
              <Text style={[styles.itemLineTotal, { color: Colors[colorScheme].text }]}>
                {lineTotal}
              </Text>
            </View>

            {/* Quantity Stepper */}
            <View
              style={[
                styles.itemStepper,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                  borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
                },
              ]}
            >
              <Pressable
                onPress={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                disabled={isBusy}
                style={styles.itemStepperBtn}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Text style={[styles.itemStepperBtnText, { color: Colors[colorScheme].text }]}>
                  −
                </Text>
              </Pressable>

              <Text style={[styles.itemStepperQty, { color: Colors[colorScheme].text }]}>
                {isBusy ? (
                  <ActivityIndicator size="small" color={Colors[colorScheme].text} />
                ) : (
                  item.quantity
                )}
              </Text>

              <Pressable
                onPress={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                disabled={isBusy}
                style={styles.itemStepperBtn}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Text style={[styles.itemStepperBtnText, { color: Colors[colorScheme].text }]}>
                  +
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
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
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA',
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>
            Shopping Cart
          </Text>
          {cartCount > 0 && (
            <View
              style={[
                styles.headerBadge,
                { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' },
              ]}
            >
              <Text style={[styles.headerBadgeText, { color: Colors[colorScheme].text }]}>
                {cartCount}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close cart"
        >
          <SymbolView
            name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
            size={24}
            tintColor={isDark ? '#8E8E93' : '#AEAEB2'}
          />
        </Pressable>
      </View>

      {/* Cart Content */}
      {cartLines.length === 0 ? (
        <View style={styles.emptyContainer}>
          <SymbolView
            name={{ ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' }}
            size={64}
            tintColor={isDark ? '#3A3A3C' : '#C7C7CC'}
          />
          <Text style={[styles.emptyTitle, { color: Colors[colorScheme].text }]}>
            Your cart is empty
          </Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
            Explore our catalog and find items you love!
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.startShoppingBtn,
              {
                backgroundColor: isDark ? '#0A84FF' : '#007AFF',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Start shopping"
          >
            <Text style={styles.startShoppingText}>Start Shopping</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={cartLines}
            keyExtractor={(item) => item.id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <Pressable
                onPress={clearCart}
                style={styles.clearCartBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear all items in cart"
              >
                <Text style={styles.clearCartText}>Clear Cart</Text>
              </Pressable>
            }
          />

          {/* Checkout Footer Bar */}
          <View
            style={[
              styles.checkoutFooter,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA',
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
                Subtotal
              </Text>
              <Text style={[styles.summaryTotal, { color: Colors[colorScheme].text }]}>
                {totalAmount}
              </Text>
            </View>

            <Text style={[styles.taxNotice, { color: isDark ? '#8E8E93' : '#8E8E93' }]}>
              Taxes and shipping calculated at checkout
            </Text>

            <Pressable
              onPress={handleProceedToCheckout}
              disabled={isCheckingOut}
              style={({ pressed }) => [
                styles.checkoutBtn,
                {
                  backgroundColor: isDark ? '#0A84FF' : '#007AFF',
                  opacity: isCheckingOut ? 0.7 : pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Proceed to Checkout"
            >
              {isCheckingOut ? (
                <View style={styles.checkoutBtnContent}>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.checkoutBtnText}>Opening Checkout...</Text>
                </View>
              ) : (
                <View style={styles.checkoutBtnContent}>
                  <SymbolView
                    name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                    size={16}
                    tintColor="#FFF"
                  />
                  <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                </View>
              )}
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  cartItemCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  itemThumbnailContainer: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemThumbnail: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  removeBtn: {
    padding: 4,
  },
  itemVariant: {
    fontSize: 12,
    marginTop: 2,
  },
  itemPriceAndQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  itemUnitPrice: {
    fontSize: 11,
  },
  itemLineTotal: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 1,
  },
  itemStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  itemStepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  itemStepperBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemStepperQty: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  clearCartBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  clearCartText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startShoppingBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  startShoppingText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  checkoutFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryTotal: {
    fontSize: 22,
    fontWeight: '800',
  },
  taxNotice: {
    fontSize: 12,
    marginBottom: 16,
  },
  checkoutBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
