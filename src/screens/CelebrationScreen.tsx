import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '@/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Celebration'>;

export default function CelebrationScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { day } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>{t('celebrate.title', { day })}</Text>
        <Text style={styles.body}>{t('celebrate.body')}</Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
          onPress={() => navigation.replace('Home')}
        >
          <Text style={styles.buttonText}>{t('celebrate.home')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.primarySoft },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 80, marginBottom: 20 },
  title: { color: theme.colors.primaryDark, fontSize: 30, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  body: { color: theme.colors.text, fontSize: 16, textAlign: 'center', marginBottom: 40 },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
