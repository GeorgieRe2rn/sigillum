import { StyleSheet, Text, View } from 'react-native';

import { getDeviceIdentity } from '../lib/runtime';
import { colors, fonts, radius } from '../theme';
import type { BiometricProfile } from '../types';

export function DevicePlate({
  biometric,
  compact,
}: {
  biometric?: BiometricProfile;
  compact?: boolean;
}) {
  const id = getDeviceIdentity();
  const android = id.os === 'android';

  const detail = (() => {
    if (id.os === 'ios' && id.runtime === 'expo-go') {
      return 'Face ID no corre en Expo Go. Se usa el código de bloqueo del iPhone.';
    }
    if (android) {
      if (biometric?.biometricsUsable) return `${biometric.unlockLabel} listos en este teléfono.`;
      if (biometric?.hasDeviceSecret) return 'Se usa el PIN, patrón o contraseña de Android.';
      return 'Configura un bloqueo de pantalla en Ajustes para abrir Sigillum.';
    }
    if (biometric?.biometricsUsable) return `${biometric.unlockLabel} listos.`;
    return 'Se usa el código de bloqueo de este iPhone.';
  })();

  return (
    <View style={[styles.plate, android ? styles.android : styles.ios, compact && styles.compact]}>
      <Text style={[styles.kicker, android ? styles.kickerAndroid : styles.kickerIos]}>
        {android ? 'Android' : 'iPhone'}
      </Text>
      <Text style={styles.plateTitle}>{id.plate}</Text>
      {compact ? null : <Text style={styles.detail}>{detail}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 12,
  },
  compact: {
    paddingVertical: 8,
    marginVertical: 0,
    marginBottom: 12,
  },
  ios: {
    backgroundColor: colors.bgCard,
    borderColor: colors.line,
  },
  android: {
    backgroundColor: colors.waxDeep,
    borderColor: '#3B82F6',
  },
  kicker: {
    fontFamily: fonts.sansMedium,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontSize: 10,
    marginBottom: 4,
  },
  kickerIos: { color: colors.gold },
  kickerAndroid: { color: '#93C5FD' },
  plateTitle: {
    fontFamily: fonts.sansSemi,
    color: colors.ink,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  detail: {
    fontFamily: fonts.sans,
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
});
