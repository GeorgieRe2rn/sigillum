import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { DevicePlate } from '../components/DevicePlate';
import { Glyph } from '../components/Glyph';
import { Screen } from '../components/Screen';
import { SealMark } from '../components/SealMark';
import { useSession } from '../context/SessionContext';
import { getDeviceIdentity } from '../lib/runtime';
import { colors, fonts } from '../theme';

type Step = 'welcome' | 'name' | 'auth';

export default function Onboarding() {
  const { hasVault, unlocked, setupVault, biometric } = useSession();
  const identity = getDeviceIdentity();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hasVault && unlocked) return <Redirect href="/(vault)/(tabs)" />;
  if (hasVault && !unlocked) return <Redirect href="/lock" />;

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      await setupVault({ displayName: name });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(vault)/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el archivo.');
      setBusy(false);
    }
  };

  if (step === 'welcome') {
    return (
      <Screen scroll>
        <View style={styles.hero}>
          <SealMark size={120} />
          <Text style={styles.wordmark}>Sigillum</Text>
          <Text style={styles.kicker}>Archivo privado</Text>
          <DevicePlate biometric={biometric} />
          <Text style={styles.lead}>
            Fotos, vídeos y documentos se quedan en este {identity.hostLabel}. Se abre con el mismo
            desbloqueo que ya usas: {biometric.unlockLabel.toLowerCase()}.
          </Text>
        </View>
        <View style={styles.points}>
          <Point
            icon={identity.os === 'android' ? 'touchid' : 'lock.fill'}
            title={identity.os === 'android' ? 'Huella o código' : 'Código del iPhone'}
            body={
              identity.os === 'android'
                ? 'Android puede usar la huella y, si falla, el PIN o el patrón del teléfono.'
                : 'En Expo Go, Face ID no está permitido. Sigillum pide el código de bloqueo del iPhone.'
            }
          />
          <Point
            icon="checkmark.seal.fill"
            title="Sin PIN extra"
            body="No creas otro código. Si desbloqueas el teléfono, desbloqueas Sigillum."
          />
          <Point
            icon="hourglass"
            title="Cápsulas"
            body="Puedes sellar un archivo hasta una fecha. Hasta entonces permanece cerrado."
          />
        </View>
        <Button title="Empezar" onPress={() => setStep('name')} />
      </Screen>
    );
  }

  if (step === 'name') {
    return (
      <Screen>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <Text style={styles.kicker}>Paso 1 de 2</Text>
          <Text style={styles.h1}>Nombre del archivo</Text>
          <Text style={styles.lead}>Solo lo ves tú, en la pantalla de bloqueo.</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Personal, trabajo, familia…"
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={() => setStep('auth')}
          />
          <View style={styles.spacer} />
          <Button title="Continuar" onPress={() => setStep('auth')} />
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.kicker}>Paso 2 de 2</Text>
      <Text style={styles.h1}>Desbloqueo del teléfono</Text>
      <Text style={styles.lead}>
        {biometric.hasDeviceSecret || biometric.biometricsUsable
          ? `Confirma con ${biometric.unlockLabel.toLowerCase()} para crear el archivo.`
          : `Pon un código de bloqueo en Ajustes de este ${identity.hostLabel} y vuelve.`}
      </Text>
      <DevicePlate biometric={biometric} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.spacer} />
      <Button
        title={`Confirmar con ${biometric.unlockLabel.toLowerCase()}`}
        onPress={finish}
        loading={busy}
        disabled={!biometric.canAuth}
        icon={
          <Glyph
            name={biometric.biometricsUsable && biometric.kind === 'fingerprint' ? 'touchid' : biometric.biometricsUsable ? 'faceid' : 'lock.fill'}
            size={18}
            color={colors.bg}
          />
        }
      />
    </Screen>
  );
}

function Point({
  icon,
  title,
  body,
}: {
  icon: 'faceid' | 'touchid' | 'lock.fill' | 'checkmark.seal.fill' | 'hourglass';
  title: string;
  body: string;
}) {
  return (
    <View style={styles.point}>
      <View style={styles.pointIcon}>
        <Glyph name={icon} size={18} color={colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.pointTitle}>{title}</Text>
        <Text style={styles.pointBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 4 },
  wordmark: { fontFamily: fonts.sansSemi, fontSize: 40, color: colors.ink, marginTop: 16, letterSpacing: -0.8 },
  kicker: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  lead: {
    fontFamily: fonts.sans,
    color: colors.inkMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 16,
  },
  h1: {
    fontFamily: fonts.sansSemi,
    color: colors.ink,
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: -0.6,
  },
  points: { gap: 14, marginVertical: 28 },
  point: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  pointIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pointTitle: { fontFamily: fonts.sansSemi, color: colors.ink, fontSize: 16 },
  pointBody: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 14, lineHeight: 20, marginTop: 2 },
  input: {
    marginTop: 28,
    borderBottomWidth: 1,
    borderBottomColor: colors.gold,
    color: colors.ink,
    fontFamily: fonts.sansSemi,
    fontSize: 24,
    paddingVertical: 12,
    textAlign: 'center',
  },
  spacer: { flex: 1 },
  error: { color: colors.danger, textAlign: 'center', fontFamily: fonts.sans, marginTop: 12 },
});
