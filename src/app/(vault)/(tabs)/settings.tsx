import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Button } from '../../../components/Button';
import { DevicePlate } from '../../../components/DevicePlate';
import { VaultHeader } from '../../../components/VaultHeader';
import { useSession } from '../../../context/SessionContext';
import { autoLockLabel, formatBytes } from '../../../lib/format';
import { getDeviceIdentity } from '../../../lib/runtime';
import { vaultStats } from '../../../lib/vault';
import { colors, fonts, radius } from '../../../theme';
import type { AutoLock } from '../../../types';

const AUTOLOCKS: AutoLock[] = ['immediate', '15s', '1m', '5m'];

export default function SettingsScreen() {
  const { settings, biometric, items, lock, updateSettings, confirmSensitive, destroyVault } = useSession();
  const stats = vaultStats(items);
  const identity = getDeviceIdentity();
  const [destroyText, setDestroyText] = useState('');
  const [showDestroy, setShowDestroy] = useState(false);

  const onDestroy = async () => {
    if (destroyText.trim().toUpperCase() !== 'SIGILLUM') {
      Alert.alert('Confirmación', 'Escribe SIGILLUM para destruir el archivo.');
      return;
    }
    const ok = await confirmSensitive('Destruir el archivo Sigillum');
    if (!ok) return;
    await destroyVault();
    router.replace('/onboarding');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <VaultHeader title="Ajustes" subtitle="Acceso y privacidad" onLock={lock} />

        <DevicePlate biometric={biometric} />

        <Text style={styles.section}>Acceso</Text>
        <View style={styles.card}>
          <Row title="Desbloqueo" body={biometric.unlockLabel} />
          <Row
            title="Velo de privacidad"
            body="Al salir de Sigillum, el contenido se cubre al instante"
            right={
              <Switch
                value={settings.privacyVeil}
                onValueChange={(v) => updateSettings({ privacyVeil: v })}
                trackColor={{ false: colors.line, true: colors.gold }}
                thumbColor={settings.privacyVeil ? colors.ink : colors.inkMuted}
              />
            }
          />
        </View>
        <Text style={styles.hint}>
          El código y la huella son los del sistema. Cámbialos en Ajustes del {identity.hostLabel}.
        </Text>

        <Text style={styles.section}>Auto-cierre</Text>
        <View style={styles.chips}>
          {AUTOLOCKS.map((value) => (
            <Pressable
              key={value}
              onPress={() => updateSettings({ autoLock: value })}
              style={[styles.chip, settings.autoLock === value && styles.chipOn]}
            >
              <Text style={[styles.chipLabel, settings.autoLock === value && styles.chipLabelOn]}>
                {autoLockLabel(value)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Este teléfono</Text>
        <View style={styles.card}>
          <Row title="Sellos" body={`${stats.total} archivos · ${formatBytes(stats.bytes)}`} />
          <Row title="Cápsulas activas" body={`${stats.capsules}`} />
          <Row
            title="Catálogo"
            body={
              identity.os === 'android'
                ? 'AES-256-GCM · llave en el Keystore de Android'
                : 'AES-256-GCM · llave en el Llavero de iOS'
            }
          />
        </View>

        <Text style={styles.section}>Zona irreversible</Text>
        <Text style={styles.warn}>
          Destruir el archivo borra fotos, vídeos, documentos, el catálogo cifrado y la llave.
        </Text>
        {!showDestroy ? (
          <Button title="Destruir archivo" variant="danger" onPress={() => setShowDestroy(true)} />
        ) : (
          <View style={styles.destroy}>
            <Text style={styles.pinTitle}>Escribe SIGILLUM</Text>
            <TextInput
              value={destroyText}
              onChangeText={setDestroyText}
              autoCapitalize="characters"
              placeholder="SIGILLUM"
              placeholderTextColor={colors.inkFaint}
              style={styles.input}
            />
            <Button title="Destruir ahora" variant="danger" onPress={onDestroy} />
            <View style={{ height: 8 }} />
            <Button title="Cancelar" variant="ghost" onPress={() => { setShowDestroy(false); setDestroyText(''); }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  title,
  body,
  right,
}: {
  title: string;
  body: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowBody}>{body}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  section: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontSize: 11,
    marginTop: 22,
    marginBottom: 10,
  },
  hint: { fontFamily: fonts.sans, color: colors.inkFaint, fontSize: 13, lineHeight: 18, marginTop: 10 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowTitle: { fontFamily: fonts.sansSemi, color: colors.ink, fontSize: 16 },
  rowBody: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 13, marginTop: 3 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
  },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipLabel: { fontFamily: fonts.sansSemi, color: colors.ink, fontSize: 12 },
  chipLabelOn: { color: colors.bg },
  pinTitle: { fontFamily: fonts.sansSemi, color: colors.ink, fontSize: 20, marginBottom: 12, textAlign: 'center' },
  warn: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  destroy: { gap: 12 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.danger,
    color: colors.ink,
    fontFamily: fonts.sansSemi,
    fontSize: 22,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
