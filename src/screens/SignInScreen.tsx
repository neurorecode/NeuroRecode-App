import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '@/lib/supabase';
import { theme } from '@/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('+91');
  const [loading, setLoading] = useState(false);

  const onSend = async () => {
    const trimmed = phone.replace(/\s/g, '');
    if (!/^\+\d{10,15}$/.test(trimmed)) {
      Alert.alert('Invalid number', 'Enter in E.164 format, e.g. +919876543210');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: trimmed });
    setLoading(false);
    if (error) return Alert.alert('Could not send OTP', error.message);
    navigation.navigate('Otp', { phone: trimmed });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Text style={styles.brand}>{t('app.name')}</Text>
        <Text style={styles.title}>{t('auth.phoneTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.phoneSubtitle')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          placeholder={t('auth.phonePlaceholder')}
          value={phone}
          onChangeText={setPhone}
          autoFocus
        />
        <Pressable
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
          onPress={onSend}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? '…' : t('auth.sendOtp')}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  brand: { color: theme.colors.primary, fontSize: 18, fontWeight: '700', marginBottom: 48, textAlign: 'center' },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: theme.colors.textSoft, fontSize: 15, marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    backgroundColor: theme.colors.card,
    marginBottom: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
