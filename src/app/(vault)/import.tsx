import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Glyph, type GlyphName } from '../../components/Glyph';
import { Screen } from '../../components/Screen';
import { VaultHeader } from '../../components/VaultHeader';
import { useSession } from '../../context/SessionContext';
import { describeError } from '../../lib/errors';
import { nameFromUri } from '../../lib/format';
import { removeOriginsAfterMove, requestMovePermissions } from '../../lib/origin';
import { isPickerInProgressError, withPickerLock } from '../../lib/pickers';
import { colors, fonts, radius } from '../../theme';

type Capsule = 'none' | '1d' | '7d' | '30d' | 'custom';

function capsuleUntil(kind: Capsule, custom: Date): number | null {
  const now = Date.now();
  if (kind === 'none') return null;
  if (kind === '1d') return now + 24 * 60 * 60 * 1000;
  if (kind === '7d') return now + 7 * 24 * 60 * 60 * 1000;
  if (kind === '30d') return now + 30 * 24 * 60 * 60 * 1000;
  return custom.getTime();
}

export default function ImportScreen() {
  const { addFromSource } = useSession();
  const [capsule, setCapsule] = useState<Capsule>('none');
  const [customDate, setCustomDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [androidDateOpen, setAndroidDateOpen] = useState(false);
  const pickingRef = useRef(false);

  const sealedUntil = () => capsuleUntil(capsule, customDate);

  const ingestMany = async (
    files: {
      uri: string;
      fileName: string;
      mimeType: string;
      kind?: 'photo' | 'video' | 'document';
      assetId?: string | null;
      origin?: {
        channel: 'gallery' | 'camera' | 'files';
        assetId?: string | null;
        originalUri?: string | null;
      };
    }[],
  ) => {
    if (!files.length) return;
    let lastId = '';
    for (let i = 0; i < files.length; i += 1) {
      setStatus(`Moviendo ${i + 1} de ${files.length}…`);
      const item = await addFromSource({
        sourceUri: files[i].uri,
        fileName: files[i].fileName,
        mimeType: files[i].mimeType,
        kind: files[i].kind,
        sealedUntil: sealedUntil(),
        origin: files[i].origin,
      });
      lastId = item.id;
    }
    setStatus('Quitando el original…');
    const cleanup = await removeOriginsAfterMove(
      files.map((file) => ({ uri: file.uri, assetId: file.assetId, kind: file.kind })),
    );
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (cleanup.galleryFailed > 0) {
      Alert.alert(
        'Quedó una copia en la galería',
        'El archivo ya está en Sigillum. El sistema no permitió borrar el original: acepta el diálogo de eliminar o bórralo a mano en Fotos.',
      );
    }
    if (files.length === 1 && lastId) {
      router.replace(`/item/${lastId}`);
    } else {
      router.back();
    }
  };

  const runPick = async (operation: () => Promise<void>) => {
    if (pickingRef.current || busy) return;
    pickingRef.current = true;
    setBusy(true);
    try {
      await operation();
    } catch (error) {
      if (isPickerInProgressError(error)) return;
      Alert.alert('No se pudo sellar', describeError(error, 'Error al importar.'));
    } finally {
      pickingRef.current = false;
      setBusy(false);
      setStatus(null);
    }
  };

  const pickLibrary = () =>
    runPick(async () => {
      const pickerPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!pickerPerm.granted) {
        Alert.alert('Fototeca', 'Sigillum necesita acceso a la galería para mover fotos y vídeos.');
        return;
      }
      const movePerm = await requestMovePermissions();
      if (!movePerm) {
        Alert.alert(
          'Borrar el original',
          'Sin permiso de la galería no se puede quitar el original. Concédalo para que el archivo solo quede en Sigillum.',
        );
        return;
      }
      const result = await withPickerLock(() =>
        ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          quality: 1,
          allowsMultipleSelection: true,
          selectionLimit: 12,
        }),
      );
      if (!result || result.canceled) return;
      await ingestMany(
        result.assets.map((asset) => {
          const video = asset.type === 'video';
          const fallback = video ? 'video.mov' : 'foto.jpg';
          return {
            uri: asset.uri,
            fileName: asset.fileName || nameFromUri(asset.uri, fallback),
            mimeType: asset.mimeType ?? (video ? 'video/quicktime' : 'image/jpeg'),
            kind: (video ? 'video' : 'photo') as 'photo' | 'video',
            assetId: asset.assetId,
            origin: { channel: 'gallery', assetId: asset.assetId, originalUri: asset.uri },
          };
        }),
      );
    });

  const pickCamera = () =>
    runPick(async () => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Cámara', 'Sigillum necesita la cámara para sellar una captura nueva.');
        return;
      }
      const result = await withPickerLock(() =>
        ImagePicker.launchCameraAsync({
          mediaTypes: ['images', 'videos'],
          quality: 1,
          videoMaxDuration: 120,
        }),
      );
      if (!result || result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.uri) {
        Alert.alert('Cámara', 'No se obtuvo ninguna captura.');
        return;
      }
      const video = asset.type === 'video';
      const fallback = video ? 'captura.mov' : 'captura.jpg';
      await ingestMany([
        {
          uri: asset.uri,
          fileName: asset.fileName || nameFromUri(asset.uri, fallback),
          mimeType: asset.mimeType ?? (video ? 'video/quicktime' : 'image/jpeg'),
          kind: video ? 'video' : 'photo',
          assetId: asset.assetId,
          origin: { channel: 'camera', assetId: asset.assetId, originalUri: asset.uri },
        },
      ]);
    });

  const pickDocuments = () =>
    runPick(async () => {
      const result = await withPickerLock(() =>
        DocumentPicker.getDocumentAsync({
          copyToCacheDirectory: Platform.OS === 'ios',
          multiple: true,
          type: '*/*',
        }),
      );
      if (!result || result.canceled) return;
      await ingestMany(
        result.assets.map((asset) => ({
          uri: asset.uri,
          fileName: asset.name || nameFromUri(asset.uri, 'documento.bin'),
          mimeType: asset.mimeType ?? 'application/octet-stream',
          kind: 'document' as const,
          origin: { channel: 'files' as const, originalUri: asset.uri },
        })),
      );
    });

  return (
    <Screen scroll>
      <VaultHeader title="Sellar" subtitle="Mover al archivo" onBack={() => router.back()} />
      <Text style={styles.lead}>
        El archivo se mueve a Sigillum y desaparece de la galería o de su ubicación original. Solo vuelve a
        salir si lo exportas.
      </Text>

      <View style={styles.grid}>
        <Source icon="photo.fill" title="Fototeca" body="Se quita de Fotos" onPress={pickLibrary} disabled={busy} />
        <Source icon="camera.fill" title="Cámara" body="Solo en Sigillum" onPress={pickCamera} disabled={busy} />
        <Source icon="folder.fill" title="Archivos" body="Se mueve aquí" onPress={pickDocuments} disabled={busy} />
      </View>

      <Text style={styles.section}>Cápsula temporal</Text>
      <Text style={styles.hint}>Opcional. El contenido permanece invisible hasta esa fecha.</Text>
      <View style={styles.chips}>
        {([
          ['none', 'Abierta'],
          ['1d', '24 h'],
          ['7d', '7 días'],
          ['30d', '30 días'],
          ['custom', 'Fecha'],
        ] as const).map(([value, label]) => (
          <Pressable
            key={value}
            onPress={() => {
              setCapsule(value);
              if (value === 'custom' && Platform.OS === 'android') setAndroidDateOpen(true);
            }}
            style={[styles.chip, capsule === value && styles.chipOn]}
            disabled={busy}
          >
            <Text style={[styles.chipLabel, capsule === value && styles.chipLabelOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {capsule === 'custom' && (Platform.OS === 'ios' || androidDateOpen) ? (
        <DateTimePicker
          value={customDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          themeVariant="dark"
          onChange={(_, date) => {
            if (Platform.OS === 'android') setAndroidDateOpen(false);
            if (date) setCustomDate(date);
          }}
        />
      ) : null}
      {capsule === 'custom' && Platform.OS === 'android' ? (
        <Text style={styles.hint}>Cápsula hasta el {customDate.toLocaleDateString('es-ES')}</Text>
      ) : null}

      {status ? <Text style={styles.status}>{status}</Text> : null}
      {busy ? <Button title="Sellando…" loading onPress={() => undefined} /> : null}
    </Screen>
  );
}

function Source({
  icon,
  title,
  body,
  onPress,
  disabled,
}: {
  icon: GlyphName;
  title: string;
  body: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.source, pressed && { opacity: 0.85 }]}>
      <View style={styles.sourceIcon}>
        <Glyph name={icon} size={20} color={colors.gold} />
      </View>
      <Text style={styles.sourceTitle}>{title}</Text>
      <Text style={styles.sourceBody}>{body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  source: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    minHeight: 132,
  },
  sourceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sourceTitle: { fontFamily: fonts.sansSemi, color: colors.ink, fontSize: 15 },
  sourceBody: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 12, marginTop: 4 },
  section: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontSize: 11,
    marginBottom: 6,
  },
  hint: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 13, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgCard,
  },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipLabel: { fontFamily: fonts.sansSemi, color: colors.ink, fontSize: 13 },
  chipLabelOn: { color: colors.bg },
  status: { fontFamily: fonts.sansMedium, color: colors.goldSoft, textAlign: 'center', marginTop: 24 },
});
