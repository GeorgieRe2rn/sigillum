import 'react-native-gesture-handler';

import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PrivacyVeil } from '../components/PrivacyVeil';
import { SessionProvider, useSession } from '../context/SessionContext';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNav() {
  const { hydrated } = useSession();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => undefined);
  }, [hydrated]);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      />
      <PrivacyVeil />
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SessionProvider>
        <RootNav />
        {!loaded ? <View style={[StyleSheet.absoluteFill, styles.fill]} /> : null}
      </SessionProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
});
