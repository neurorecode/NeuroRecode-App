import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setLanguage } from '@/lib/i18n';
import { useAuthStore } from '@/store/useAuth';
import { supabase } from '@/lib/supabase';
import { theme } from '@/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuthStore();

  const changeLang = async (lng: 'en' | 'ta') => {
    setLanguage(lng);
    if (profile) await supabase.from('users').update({ language: lng }).eq('id', profile.id);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('settings.title')}</Text>

        <Text style={styles.section}>{t('settings.language')}</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.chip, profile?.language === 'en' && styles.chipActive]}
            onPress={() => changeLang('en')}
          >
            <Text style={profile?.language === 'en' ? styles.chipActiveText : styles.chipText}>English</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, profile?.language === 'ta' && styles.chipActive]}
            onPress={() => changeLang('ta')}
          >
            <Text style={profile?.language === 'ta' ? styles.chipActiveText : styles.chipText}>தமிழ்</Text>
          </Pressable>
        </View>

        <Pressable style={styles.logout} onPress={signOut}>
          <Text style={styles.logoutText}>{t('settings.logout')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: { padding: 24 },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '700', marginBottom: 24 },
  section: { color: theme.colors.textSoft, marginBottom: 8, marginTop: 16 },
  row: { flexDirection: 'row', gap: 12 },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.text },
  chipActiveText: { color: '#fff', fontWeight: '600' },
  logout: { marginTop: 40, alignItems: 'center' },
  logoutText: { color: theme.colors.danger, fontWeight: '600' },
});
