import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuth';
import { todayIst } from '@/lib/time';
import { theme } from '@/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Intro'>;

export default function IntroScreen({}: Props) {
  const { t } = useTranslation();
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const [loading, setLoading] = useState(false);

  const onStart = async () => {
    setLoading(true);
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    await supabase.from('programmes').insert({
      user_id: uid,
      start_date: todayIst(),
      status: 'active',
      current_day: 1,
    });
    await supabase.from('users').update({ onboarding_complete: true }).eq('id', uid);
    await bootstrap();
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('intro.title')}</Text>
        <Text style={styles.body}>{t('intro.body')}</Text>
        <View style={styles.rules}>
          <Rule text="One photo per day, taken between 12 AM and 11:59 PM IST." />
          <Rule text="No gallery uploads. Camera only." />
          <Rule text="Miss 3 days in a row and our team reaches out." />
          <Rule text="Finish 60 days to unlock your completion certificate." />
        </View>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
          onPress={onStart}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? '…' : t('intro.start')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Rule({ text }: { text: string }) {
  return (
    <View style={styles.ruleRow}>
      <View style={styles.bullet} />
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: { padding: 24 },
  title: { color: theme.colors.text, fontSize: 26, fontWeight: '700', marginBottom: 16, marginTop: 24 },
  body: { color: theme.colors.textSoft, fontSize: 16, lineHeight: 24, marginBottom: 24 },
  rules: { gap: 12, marginBottom: 32 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 7,
  },
  ruleText: { color: theme.colors.text, fontSize: 15, flex: 1 },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
