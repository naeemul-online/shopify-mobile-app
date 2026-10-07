import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AuthForm } from '@/components/AuthForm';
import { OrderCard } from '@/components/OrderCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/src/context/AuthContext';
import { CustomerOrder, CustomerProfile } from '@/src/types/shopify';

function ProfileEditor({ customer }: { customer: CustomerProfile }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { updateProfile, isUpdatingProfile } = useAuth();

  const [firstName, setFirstName] = useState(customer.firstName ?? '');
  const [lastName, setLastName] = useState(customer.lastName ?? '');
  const [phone, setPhone] = useState(customer.phone ?? '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile.');
    }
  };

  return (
    <View style={styles.profileSection}>
      <Text style={[styles.sectionHeading, { color: Colors[colorScheme].text }]}>
        Edit Profile
      </Text>

      {saveSuccess && (
        <View style={styles.successBanner}>
          <SymbolView
            name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
            size={18}
            tintColor="#34C759"
          />
          <Text style={styles.successText}>Profile updated successfully!</Text>
        </View>
      )}

      {saveError && (
        <View style={styles.errorBanner}>
          <SymbolView
            name={{ ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' }}
            size={18}
            tintColor="#FF3B30"
          />
          <Text style={styles.errorText}>{saveError}</Text>
        </View>
      )}

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
            FIRST NAME
          </Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First Name"
            placeholderTextColor={isDark ? '#48484A' : '#AEAEB2'}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                color: Colors[colorScheme].text,
              },
            ]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
            LAST NAME
          </Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last Name"
            placeholderTextColor={isDark ? '#48484A' : '#AEAEB2'}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                color: Colors[colorScheme].text,
              },
            ]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
            PHONE NUMBER
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 555-0199"
            placeholderTextColor={isDark ? '#48484A' : '#AEAEB2'}
            keyboardType="phone-pad"
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                color: Colors[colorScheme].text,
              },
            ]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
            EMAIL ADDRESS (FIXED)
          </Text>
          <TextInput
            value={customer.email}
            editable={false}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#141416' : '#E5E5EA',
                borderColor: isDark ? '#2C2C2E' : '#D1D1D6',
                color: isDark ? '#8E8E93' : '#6E6E73',
              },
            ]}
          />
        </View>

        <Pressable
          onPress={handleSaveProfile}
          disabled={isUpdatingProfile}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: isDark ? '#0A84FF' : '#007AFF',
              opacity: isUpdatingProfile ? 0.7 : pressed ? 0.85 : 1,
            },
          ]}
        >
          {isUpdatingProfile ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    customer,
    isAuthenticated,
    isLoading,
    logout,
    refetchCustomer,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      refetchCustomer();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Loading state during initial restore
  if (isLoading && !customer) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}
      >
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={isDark ? '#FFF' : '#007AFF'} />
          <Text style={[styles.loadingText, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
            Loading your account...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Unauthenticated: Show AuthForm
  if (!isAuthenticated || !customer) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}
      >
        <AuthForm />
      </SafeAreaView>
    );
  }

  const orders: CustomerOrder[] = customer.orders?.edges?.map((e) => e.node) ?? [];
  const initials = `${(customer.firstName?.[0] || customer.displayName?.[0] || 'U')}${customer.lastName?.[0] || ''
    }`.toUpperCase();

  const renderHeader = () => (
    <View style={styles.dashboardHeader}>
      {/* Avatar & User Details */}
      <View style={styles.userCard}>
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: isDark ? '#0A84FF' : '#007AFF' },
          ]}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: Colors[colorScheme].text }]}>
            {customer.displayName || `${customer.firstName || ''} ${customer.lastName || ''}`}
          </Text>
          <Text style={[styles.userEmail, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
            {customer.email}
          </Text>
          {customer.phone && (
            <Text style={[styles.userPhone, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
              {customer.phone}
            </Text>
          )}
        </View>

        <Pressable
          onPress={logout}
          style={styles.logoutBtn}
          accessibilityRole="button"
          accessibilityLabel="Log out of account"
        >
          <SymbolView
            name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
            size={20}
            tintColor={isDark ? '#FF453A' : '#FF3B30'}
          />
        </Pressable>
      </View>

      {/* Segmented Control */}
      <View
        style={[
          styles.tabsContainer,
          { backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA' },
        ]}
      >
        <Pressable
          onPress={() => setActiveTab('orders')}
          style={[
            styles.tabBtn,
            activeTab === 'orders' && [
              styles.tabBtnActive,
              { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
            ],
          ]}
        >
          <Text
            style={[
              styles.tabBtnText,
              {
                color:
                  activeTab === 'orders'
                    ? Colors[colorScheme].text
                    : isDark
                      ? '#8E8E93'
                      : '#6E6E73',
                fontWeight: activeTab === 'orders' ? '700' : '500',
              },
            ]}
          >
            My Orders ({orders.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('profile')}
          style={[
            styles.tabBtn,
            activeTab === 'profile' && [
              styles.tabBtnActive,
              { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
            ],
          ]}
        >
          <Text
            style={[
              styles.tabBtnText,
              {
                color:
                  activeTab === 'profile'
                    ? Colors[colorScheme].text
                    : isDark
                      ? '#8E8E93'
                      : '#6E6E73',
                fontWeight: activeTab === 'profile' ? '700' : '500',
              },
            ]}
          >
            Profile & Settings
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#000000' : '#F2F2F7' },
      ]}
    >
      {activeTab === 'orders' ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderCard order={item} />}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? '#FFF' : '#007AFF'}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyOrdersContainer}>
              <SymbolView
                name={{ ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' }}
                size={54}
                tintColor={isDark ? '#3A3A3C' : '#C7C7CC'}
              />
              <Text style={[styles.emptyOrdersTitle, { color: Colors[colorScheme].text }]}>
                No Orders Yet
              </Text>
              <Text style={[styles.emptyOrdersSubtitle, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
                Your order history will appear here once you make your first purchase.
              </Text>
            </View>
          }
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <FlatList
            data={[]}
            renderItem={null}
            ListHeaderComponent={
              <>
                {renderHeader()}
                <ProfileEditor key={customer.id} customer={customer} />
              </>
            }
            contentContainerStyle={styles.listContent}
          />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  dashboardHeader: {
    marginBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
  },
  userPhone: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    padding: 10,
    borderRadius: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 14,
  },
  emptyOrdersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyOrdersTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  emptyOrdersSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  profileSection: {
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    color: '#34C759',
    fontSize: 13,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
