import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/useAuth';
import SignInScreen from '@/screens/SignInScreen';
import OtpScreen from '@/screens/OtpScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import IntroScreen from '@/screens/IntroScreen';
import HomeScreen from '@/screens/HomeScreen';
import UploadScreen from '@/screens/UploadScreen';
import CelebrationScreen from '@/screens/CelebrationScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import { theme } from '@/theme';

export type RootStackParamList = {
  SignIn: undefined;
  Otp: { phone: string };
  Onboarding: undefined;
  Intro: undefined;
  Home: undefined;
  Upload: undefined;
  Celebration: { day: number };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { session, profile, loading } = useAuthStore();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
        </>
      ) : !profile?.onboarding_complete ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Intro" component={IntroScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Upload" component={UploadScreen} />
          <Stack.Screen name="Celebration" component={CelebrationScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
