import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/theme';

export type DayStatus = 'done' | 'missed' | 'upcoming' | 'today';

type Props = {
  statuses: DayStatus[];
};

export default function CalendarGrid({ statuses }: Props) {
  return (
    <View style={styles.grid}>
      {statuses.map((s, i) => (
        <View key={i} style={[styles.cell, styleFor(s)]}>
          <Text style={[styles.cellText, textStyleFor(s)]}>{i + 1}</Text>
        </View>
      ))}
    </View>
  );
}

function styleFor(s: DayStatus) {
  switch (s) {
    case 'done':
      return { backgroundColor: theme.colors.success, borderColor: theme.colors.success };
    case 'missed':
      return { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger };
    case 'today':
      return { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary };
    default:
      return { backgroundColor: theme.colors.card, borderColor: theme.colors.border };
  }
}

function textStyleFor(s: DayStatus) {
  if (s === 'done' || s === 'missed') return { color: '#fff' };
  if (s === 'today') return { color: theme.colors.primary, fontWeight: '700' as const };
  return { color: theme.colors.textSoft };
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  cell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { fontSize: 12 },
});
