import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const SLOTS: Array<{ hour: number; minute: number; key: string }> = [
  { hour: 7, minute: 0, key: 'morning' },
  { hour: 12, minute: 30, key: 'midday' },
  { hour: 18, minute: 0, key: 'evening' },
  { hour: 21, minute: 30, key: 'final' },
];

export async function registerForPushAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0F766E',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

  const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined))
    .data;

  const { data: userRes } = await supabase.auth.getUser();
  if (userRes?.user?.id) {
    await supabase
      .from('users')
      .update({ expo_push_token: token })
      .eq('id', userRes.user.id);
  }
  return token;
}

export async function scheduleLocalReminders(
  times: Array<{ hour: number; minute: number }> = SLOTS
) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const t of times) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Neuro Recode',
        body: "Your RRR is still pending today. Upload now to keep your streak.",
      },
      trigger: { hour: t.hour, minute: t.minute, repeats: true },
    });
  }
}
