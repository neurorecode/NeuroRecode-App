import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '@/lib/supabase';
import { theme } from '@/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

export default function OtpScreen({ route }: Props) {
  const { t } = useTranslation();
  const { phone } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const onVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
    setLoading(false);
    if (error) return Alert.alert('Invalid code', error.message);
    const uid = data.user?.id;
    if (uid) {
      await supabase.from('users').upsert({ id: uid, phone }, { onConflict: 'id' });
    }
  };

  const onResend = async () => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) Alert.alert('Resend failed', error.message);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Text style={styles.title}>{t('auth.otpTitle')}</Text>
        <Text style={styles.subtitle}>{phone}</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          autoFocus
          placeholder="••••••"
        />
        <Pressable
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
          onPress={onVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? '…' : t('auth.verify')}</Text>
        </Pressable>
        <Pressable onPress={onResend}>
          <Text style={styles.resend}>{t('auth.resend')}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: theme.colors.textSoft, marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: theme.colors.card,
    marginBottom: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  resend: { color: theme.colors.primary, textAlign: 'center' },
});
