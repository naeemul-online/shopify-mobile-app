import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

import { useAuth } from '@/src/context/AuthContext';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';

export function AuthForm() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { login, register, isLoggingIn, isRegistering } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmitting = isLoggingIn || isRegistering;

  const handleSubmit = async () => {
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    try {
      if (mode === 'login') {
        await login({ email: trimmedEmail, password });
      } else {
        await register({
          email: trimmedEmail,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    }
  };

  const handleUseDemoAccount = () => {
    setEmail('testuser_1790144980053@example.com');
    setPassword('TestPassword123!');
    setErrorMessage(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA' },
            ]}
          >
            <SymbolView
              name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }}
              size={56}
              tintColor={isDark ? '#0A84FF' : '#007AFF'}
            />
          </View>
          <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
            {mode === 'login'
              ? 'Sign in to access your orders and profile'
              : 'Sign up to track orders and save your details'}
          </Text>
        </View>

        {/* Mode Toggle Tabs */}
        <View
          style={[
            styles.segmentContainer,
            { backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA' },
          ]}
        >
          <Pressable
            onPress={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            style={[
              styles.segmentTab,
              mode === 'login' && [
                styles.segmentTabActive,
                { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
              ],
            ]}
          >
            <Text
              style={[
                styles.segmentTabText,
                {
                  color:
                    mode === 'login'
                      ? Colors[colorScheme].text
                      : isDark
                      ? '#8E8E93'
                      : '#6E6E73',
                  fontWeight: mode === 'login' ? '700' : '500',
                },
              ]}
            >
              Sign In
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            style={[
              styles.segmentTab,
              mode === 'register' && [
                styles.segmentTabActive,
                { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
              ],
            ]}
          >
            <Text
              style={[
                styles.segmentTabText,
                {
                  color:
                    mode === 'register'
                      ? Colors[colorScheme].text
                      : isDark
                      ? '#8E8E93'
                      : '#6E6E73',
                  fontWeight: mode === 'register' ? '700' : '500',
                },
              ]}
            >
              Create Account
            </Text>
          </Pressable>
        </View>

        {/* Error Banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <SymbolView
              name={{ ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' }}
              size={18}
              tintColor="#FF3B30"
            />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Inputs */}
        <View style={styles.formFields}>
          {mode === 'register' && (
            <View style={styles.rowInputs}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
                  FIRST NAME
                </Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
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

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
                  LAST NAME
                </Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
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
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
              EMAIL ADDRESS
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={isDark ? '#48484A' : '#AEAEB2'}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
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

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#8E8E93' : '#6E6E73' }]}>
              PASSWORD
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={isDark ? '#48484A' : '#AEAEB2'}
              secureTextEntry
              autoCapitalize="none"
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

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor: isDark ? '#0A84FF' : '#007AFF',
                opacity: isSubmitting ? 0.7 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </Pressable>

          {/* Quick Demo Credentials Helper */}
          {mode === 'login' && (
            <Pressable
              onPress={handleUseDemoAccount}
              style={styles.demoAccountBtn}
              accessibilityRole="button"
              accessibilityLabel="Fill demo test credentials"
            >
              <Text style={[styles.demoAccountText, { color: isDark ? '#0A84FF' : '#007AFF' }]}>
                Use Demo Test Credentials
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 48,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentTabActive: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  formFields: {
    gap: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
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
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  demoAccountBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  demoAccountText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

