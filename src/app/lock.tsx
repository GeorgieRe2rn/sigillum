import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DevicePlate } from '../components/DevicePlate';
import { Glyph } from '../components/Glyph';
import { Screen } from '../components/Screen';
import { SealMark } from '../components/SealMark';
import { useSession } from '../context/SessionContext';
import { colors, fonts } from '../theme';

export default function LockScreen() {
  const { hasVault, unlocked, settings, biometric, unlockWithDevice } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hasVault || unlocked) return;
    const t = setTimeout(() => {
      unlock();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVault, unlocked]);

  if (!hasVault) return <Redirect href="/onboarding" />;
  if (unlocked) return <Redirect href="/(vault)/(tabs)" />;

  const unlock = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await unlockWithDevice();
    if (result.ok) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(vault)/(tabs)');
      return;
    }
    setError(result.error);
    setBusy(false);
  };

  const icon =
    biometric.biometricsUsable && biometric.kind === 'fingerprint'
      ? 'touchid'
      : biometric.biometricsUsable
        ? 'faceid'
        : 'lock.fill';

  return (
    <Screen>
      <View style={styles.hero}>
        <SealMark size={112} />
        <Text style={styles.wordmark}>Sigillum</Text>
        <Text style={styles.name}>{settings.displayName}</Text>
        <DevicePlate biometric={biometric} compact />
      </View>

      <View style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable onPress={unlock} style={styles.bioBtn} disabled={busy}>
          <Glyph name={icon} size={40} color={colors.gold} />
        </Pressable>
        <Text style={styles.bioLabel}>{busy ? 'Esperando al sistema…' : `Abrir con ${biometric.unlockLabel.toLowerCase()}`}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 28 },
  wordmark: {
    fontFamily: fonts.sansSemi,
    fontSize: 38,
    color: colors.ink,
    marginTop: 16,
    letterSpacing: -0.8,
  },
  name: { fontFamily: fonts.sansMedium, color: colors.goldSoft, fontSize: 16, marginTop: 4, marginBottom: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: {
    color: colors.danger,
    fontFamily: fonts.sans,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  bioBtn: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  bioLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.ink,
    marginTop: 18,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
