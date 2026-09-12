import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import type { BiometricKind, BiometricProfile } from '../types';
import { suppressAutoLock } from './lockGate';
import { getDeviceIdentity, iosExpoGoBlocksBiometrics } from './runtime';

function kindFromTypes(types: LocalAuthentication.AuthenticationType[]): BiometricKind {
  if (Platform.OS === 'android') {
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
    return 'none';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
  return 'none';
}

export function biometricLabel(kind: BiometricKind): string {
  if (Platform.OS === 'android') {
    if (kind === 'fingerprint') return 'Huella dactilar';
    if (kind === 'face') return 'Desbloqueo facial';
    return 'código del teléfono';
  }
  if (kind === 'face') return 'Face ID';
  if (kind === 'fingerprint') return 'Touch ID';
  return 'código del iPhone';
}

export async function getBiometricProfile(): Promise<BiometricProfile> {
  const identity = getDeviceIdentity();
  const iosGo = iosExpoGoBlocksBiometrics();

  const [hasHardware, enrolled, types, level] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
    LocalAuthentication.getEnrolledLevelAsync(),
  ]);

  const kind = kindFromTypes(types);
  const hasDeviceSecret = level >= LocalAuthentication.SecurityLevel.SECRET;
  const biometricsUsable = hasHardware && enrolled && !iosGo;
  const canUnlock = hasDeviceSecret || biometricsUsable;

  let unlockLabel = identity.os === 'ios' ? 'Código del iPhone' : 'Código del teléfono';
  if (iosGo) {
    unlockLabel = 'Código del iPhone';
  } else if (biometricsUsable && identity.os === 'android') {
    unlockLabel = kind === 'face' ? 'Cara o código del teléfono' : 'Huella o código del teléfono';
  } else if (biometricsUsable && identity.os === 'ios') {
    unlockLabel = kind === 'fingerprint' ? 'Touch ID o código' : 'Face ID o código';
  }

  return {
    hasHardware,
    enrolled,
    kind,
    canAuth: canUnlock,
    biometricsUsable,
    hasDeviceSecret,
    label: iosGo ? 'Código del iPhone' : biometricLabel(kind),
    unlockLabel,
    blockedReason: iosGo ? 'ios-expo-go' : null,
  };
}

let authInFlight = false;

export async function promptDeviceAuth(promptMessage: string): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  if (authInFlight) return { ok: false, reason: 'app_cancel' };
  const profile = await getBiometricProfile();
  if (!profile.canAuth) return { ok: false, reason: 'passcode_not_set' };

  const iosGo = iosExpoGoBlocksBiometrics();
  const identity = getDeviceIdentity();

  authInFlight = true;
  let result: LocalAuthentication.LocalAuthenticationResult;
  try {
    result = await suppressAutoLock(() =>
      LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
        fallbackLabel: identity.os === 'ios' ? 'Código del iPhone' : 'Código del teléfono',
        biometricsSecurityLevel: iosGo ? 'weak' : 'strong',
        promptSubtitle: profile.unlockLabel,
        promptDescription: iosGo
          ? 'Usa el código de bloqueo de este iPhone. Face ID no está disponible en Expo Go.'
          : 'Usa la huella, el rostro o el código de bloqueo de este teléfono.',
      }),
    );
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'authentication_failed' };
  } finally {
    authInFlight = false;
  }

  if (result.success) return { ok: true };
  return { ok: false, reason: result.error };
}

export function biometricErrorMessage(reason: string, label: string): string {
  const device = getDeviceIdentity().hostLabel;
  switch (reason) {
    case 'ios_expo_go':
      return 'Face ID no está permitido en Expo Go. Usa el código de bloqueo del iPhone.';
    case 'not_available':
      return `Este ${device} no tiene sensor biométrico. Usa el código de bloqueo.`;
    case 'not_enrolled':
      return `No hay ${label} configurado. Actívalo en Ajustes o usa el código del ${device}.`;
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return 'Autenticación cancelada.';
    case 'lockout':
      return 'El sistema ha bloqueado el sensor un momento. Prueba el código del teléfono.';
    case 'passcode_not_set':
      return `Pon un código de bloqueo en Ajustes de este ${device} para usar Sigillum.`;
    case 'user_fallback':
      return 'Usa el código de bloqueo del teléfono.';
    case 'authentication_failed':
      return 'No se reconoció. Prueba otra vez.';
    default:
      return `No se pudo desbloquear. Usa ${label}.`;
  }
}
