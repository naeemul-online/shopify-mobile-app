import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';
import { CustomerOrder, formatPrice } from '@/src/types/shopify';

interface OrderCardProps {
  order: CustomerOrder;
}

export function OrderCard({ order }: OrderCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = new Date(order.processedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const totalFormatted = formatPrice(
    order.totalPrice.amount,
    order.totalPrice.currencyCode
  );

  const lineItems = order.lineItems.edges.map((e) => e.node);
  const totalItemsCount = lineItems.reduce((acc, item) => acc + item.quantity, 0);

  const isPaid = order.financialStatus?.toUpperCase() === 'PAID';
  const isFulfilled = order.fulfillmentStatus?.toUpperCase() === 'FULFILLED';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
        },
      ]}
    >
      {/* Order Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.orderNumber, { color: Colors[colorScheme].text }]}>
            {order.name || `#${order.orderNumber}`}
          </Text>
          <Text style={[styles.orderDate, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
            Placed on {formattedDate}
          </Text>
        </View>

        <Text style={[styles.orderTotal, { color: Colors[colorScheme].text }]}>
          {totalFormatted}
        </Text>
      </View>

      {/* Badges Row */}
      <View style={styles.badgesRow}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isPaid
                ? 'rgba(48, 209, 88, 0.15)'
                : 'rgba(255, 159, 10, 0.15)',
            },
          ]}
        >
          <View
            style={[
              styles.badgeDot,
              { backgroundColor: isPaid ? '#34C759' : '#FF9F0A' },
            ]}
          />
          <Text
            style={[
              styles.badgeText,
              { color: isPaid ? (isDark ? '#30D158' : '#28A745') : '#FF9F0A' },
            ]}
          >
            {order.financialStatus || 'Payment Pending'}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isFulfilled
                ? 'rgba(48, 209, 88, 0.15)'
                : isDark
                ? 'rgba(142, 142, 147, 0.15)'
                : 'rgba(142, 142, 147, 0.12)',
            },
          ]}
        >
          <View
            style={[
              styles.badgeDot,
              { backgroundColor: isFulfilled ? '#34C759' : '#8E8E93' },
            ]}
          />
          <Text
            style={[
              styles.badgeText,
              { color: isFulfilled ? (isDark ? '#30D158' : '#28A745') : '#8E8E93' },
            ]}
          >
            {order.fulfillmentStatus || 'Unfulfilled'}
          </Text>
        </View>
      </View>

      {/* Expand/Collapse Header */}
      <Pressable
        onPress={() => setIsExpanded((prev) => !prev)}
        style={styles.toggleRow}
        accessibilityRole="button"
        accessibilityLabel={`${isExpanded ? 'Hide' : 'View'} ${totalItemsCount} items in order`}
      >
        <Text style={[styles.toggleText, { color: isDark ? '#0A84FF' : '#007AFF' }]}>
          {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}{' '}
          {isExpanded ? '▴ Hide Details' : '▾ View Details'}
        </Text>
      </Pressable>

      {/* Expanded Line Items */}
      {isExpanded && (
        <View
          style={[
            styles.itemsContainer,
            {
              borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA',
            },
          ]}
        >
          {lineItems.map((item, idx) => {
            const itemPriceFormatted = item.variant?.price
              ? formatPrice(item.variant.price.amount, item.variant.price.currencyCode)
              : null;

            return (
              <View key={idx} style={styles.itemRow}>
                <View
                  style={[
                    styles.thumbnailContainer,
                    { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                  ]}
                >
                  {item.variant?.image?.url ? (
                    <Image
                      source={{ uri: item.variant.image.url }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <SymbolView
                      name={{ ios: 'photo', android: 'image', web: 'image' }}
                      size={20}
                      tintColor={isDark ? '#8E8E93' : '#AEAEB2'}
                    />
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text
                    numberOfLines={2}
                    style={[styles.itemTitle, { color: Colors[colorScheme].text }]}
                  >
                    {item.title}
                  </Text>
                  {item.variant?.title &&
                    item.variant.title.toLowerCase() !== 'default title' && (
                      <Text style={[styles.itemVariant, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
                        {item.variant.title}
                      </Text>
                    )}
                  <View style={styles.itemSubRow}>
                    <Text style={[styles.itemQuantity, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
                      Qty: {item.quantity}
                    </Text>
                    {itemPriceFormatted && (
                      <Text style={[styles.itemPrice, { color: Colors[colorScheme].text }]}>
                        {itemPriceFormatted}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  orderDate: {
    fontSize: 12,
    marginTop: 2,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '800',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  toggleRow: {
    paddingTop: 4,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 12,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnailContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  itemVariant: {
    fontSize: 11,
    marginTop: 2,
  },
  itemSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
  },
});

