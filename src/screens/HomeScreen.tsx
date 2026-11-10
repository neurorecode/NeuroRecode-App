import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import ProgressRing from '@/components/ProgressRing';
import CalendarGrid, { DayStatus } from '@/components/CalendarGrid';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuth';
import { dayNumberFromStart, todayIst } from '@/lib/time';
import { theme } from '@/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type DailyRow = { day_number: number; uploaded_at: string };

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { profile, programme, refreshProgramme } = useAuthStore();
  const [uploads, setUploads] = useState<DailyRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!programme) return;
    const { data } = await supabase
      .from('daily_uploads')
      .select('day_number, uploaded_at')
      .eq('programme_id', programme.id)
      .order('day_number', { ascending: true });
    setUploads((data as DailyRow[]) ?? []);
  }, [programme]);

  useFocusEffect(
    useCallback(() => {
      refreshProgramme().then(load);
    }, [refreshProgramme, load])
  );

  useEffect(() => {
    load();
  }, [load]);

  if (!programme) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 24 }}>{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  const today = todayIst();
  const todayDay = Math.min(60, Math.max(1, dayNumberFromStart(programme.start_date, today)));
  const doneDays = new Set(uploads.map((u) => u.day_number));
  const todayDone = doneDays.has(todayDay);

  const statuses: DayStatus[] = Array.from({ length: 60 }, (_, i) => {
    const d = i + 1;
    if (doneDays.has(d)) return 'done';
    if (d === todayDay) return 'today';
    if (d < todayDay) return 'missed';
    return 'upcoming';
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProgramme();
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.hello}>Hi {profile?.name ?? ''}</Text>
          <Pressable onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settings}>⚙︎</Text>
          </Pressable>
        </View>

        <View style={styles.ringWrap}>
          <ProgressRing
            progress={todayDay / 60}
            value={String(todayDay)}
            label={t('home.dayOf', { day: todayDay })}
          />
        </View>

        <View style={[styles.statusChip, todayDone ? styles.chipDone : styles.chipPending]}>
          <Text style={[styles.statusText, todayDone ? styles.statusDoneText : styles.statusPendingText]}>
            {todayDone ? t('home.completed') : t('home.pending')}
          </Text>
        </View>

        {programme.consecutive_misses >= 2 && (
          <View style={styles.warn}>
            <Text style={styles.warnText}>
              {programme.consecutive_misses >= 3 ? t('home.warning3') : t('home.warning2')}
            </Text>
          </View>
        )}

        {!todayDone && (
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
            onPress={() => navigation.navigate('Upload')}
          >
            <Text style={styles.ctaText}>{t('home.upload')}</Text>
          </Pressable>
        )}

        <View style={styles.statsRow}>
          <Stat label={t('home.streak')} value={programme.streak} />
          <Stat label={t('home.longest')} value={programme.longest_streak} />
          <Stat label={t('home.missed')} value={programme.missed_days} />
        </View>

        <View style={{ marginTop: 24 }}>
          <CalendarGrid statuses={statuses} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { color: theme.colors.text, fontSize: 20, fontWeight: '600' },
  settings: { fontSize: 22, color: theme.colors.textSoft },
  ringWrap: { alignItems: 'center', marginVertical: 24 },
  statusChip: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    marginBottom: 20,
  },
  chipDone: { backgroundColor: '#DCFCE7' },
  chipPending: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 14, fontWeight: '600' },
  statusDoneText: { color: theme.colors.success },
  statusPendingText: { color: theme.colors.danger },
  warn: {
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: theme.radius.md,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  warnText: { color: '#78350F' },
  cta: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
  statLabel: { color: theme.colors.textSoft, fontSize: 12, marginTop: 4, textAlign: 'center' },
});
