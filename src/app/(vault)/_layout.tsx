import { Redirect, Stack } from 'expo-router';

import { useSession } from '../../context/SessionContext';
import { colors } from '../../theme';

export default function VaultLayout() {
  const { hasVault, unlocked, hydrated } = useSession();

  return (
    <>
      {hydrated && !hasVault ? <Redirect href="/onboarding" /> : null}
      {hydrated && hasVault && !unlocked ? <Redirect href="/lock" /> : null}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="item/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="import" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="search" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
