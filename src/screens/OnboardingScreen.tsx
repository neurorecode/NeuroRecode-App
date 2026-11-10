import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '@/lib/supabase';
import { setLanguage } from '@/lib/i18n';
import { useAuthStore } from '@/store/useAuth';
import { theme } from '@/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [time, setTime] = useState('07:00');
  const [whatsapp, setWhatsapp] = useState(true);
  const [push, setPush] = useState(true);
  const [loading, setLoading] = useState(false);

  const onContinue = async () => {
    if (!name.trim()) return Alert.alert('Name required');
    if (!whatsapp && !push) {
      return Alert.alert('Reminders required', 'At least one reminder channel must be enabled.');
    }
    setLoading(true);
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from('users')
      .update({
        name: name.trim(),
        language: lang,
        preferred_time: time,
        consent_whatsapp: whatsapp,
        consent_push: push,
      })
      .eq('id', uid);
    setLoading(false);
    if (error) return Alert.alert('Could not save', error.message);
    setLanguage(lang);
    navigation.navigate('Intro');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('onboarding.title', { name: name || '' })}</Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('onboarding.namePlaceholder')}
        />

        <Text style={styles.label}>{t('onboarding.languageLabel')}</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.chip, lang === 'en' && styles.chipActive]}
            onPress={() => setLang('en')}
          >
            <Text style={lang === 'en' ? styles.chipTextActive : styles.chipText}>
              {t('onboarding.english')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.chip, lang === 'ta' && styles.chipActive]}
            onPress={() => setLang('ta')}
          >
            <Text style={lang === 'ta' ? styles.chipTextActive : styles.chipText}>
              {t('onboarding.tamil')}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>{t('onboarding.timeLabel')}</Text>
        <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="07:00" />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{t('onboarding.consentWhatsapp')}</Text>
          <Switch value={whatsapp} onValueChange={setWhatsapp} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{t('onboarding.consentPush')}</Text>
          <Switch value={push} onValueChange={setPush} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
          onPress={onContinue}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? '…' : t('onboarding.continue')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: { padding: 24 },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '700', marginBottom: 24 },
  label: { color: theme.colors.textSoft, marginTop: 20, marginBottom: 8, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: theme.colors.card,
  },
  row: { flexDirection: 'row', gap: 12 },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  switchText: { color: theme.colors.text, fontSize: 15, flex: 1, paddingRight: 12 },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
