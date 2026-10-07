import { Link, Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCart } from '@/src/context/CartContext';

function HeaderCartButton({ colorScheme }: { colorScheme: 'light' | 'dark' }) {
  const { cartCount } = useCart();

  return (
    <Link href="/modal" asChild>
      <Pressable
        style={styles.headerCartBtn}
        accessibilityRole="button"
        accessibilityLabel={`Shopping cart, ${cartCount} items`}
      >
        {({ pressed }) => (
          <View style={{ opacity: pressed ? 0.6 : 1 }}>
            <SymbolView
              name={{ ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' }}
              size={24}
              tintColor={Colors[colorScheme].text}
            />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'bag.fill',
                android: 'shopping_bag',
                web: 'shopping_bag',
              }}
              tintColor={color}
              size={26}
            />
          ),
          headerRight: () => <HeaderCartButton colorScheme={colorScheme} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'person.crop.circle.fill',
                android: 'person',
                web: 'person',
              }}
              tintColor={color}
              size={26}
            />
          ),
          headerRight: () => <HeaderCartButton colorScheme={colorScheme} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerCartBtn: {
    marginRight: 16,
    position: 'relative',
    padding: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
